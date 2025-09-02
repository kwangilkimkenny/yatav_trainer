"""
Audio Service for YATAV Training System
Handles STT (Speech-to-Text) and TTS (Text-to-Speech) functionality
"""

import asyncio
import tempfile
import os
import logging
from typing import Optional, Dict, Any, BinaryIO
from io import BytesIO
import json

# STT/TTS Libraries
import speech_recognition as sr
import openai
import httpx
from elevenlabs import AsyncElevenLabs
import azure.cognitiveservices.speech as speechsdk

# Audio processing
from pydub import AudioSegment
import wave

logger = logging.getLogger(__name__)

class STTProvider:
    """Base STT provider interface"""
    
    async def transcribe_audio(self, audio_data: bytes, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError

class WhisperSTTProvider(STTProvider):
    """OpenAI Whisper STT provider"""
    
    def __init__(self, api_key: str, model: str = "whisper-1"):
        self.api_key = api_key
        self.model = model
        self.client = openai.AsyncOpenAI(api_key=api_key)
        logger.info("Whisper STT provider initialized")
    
    async def transcribe_audio(self, audio_data: bytes, **kwargs) -> Dict[str, Any]:
        """Transcribe audio using OpenAI Whisper"""
        try:
            # Create temporary file for audio data
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
                temp_audio.write(audio_data)
                temp_audio_path = temp_audio.name
            
            try:
                # Transcribe using Whisper
                with open(temp_audio_path, 'rb') as audio_file:
                    response = await self.client.audio.transcriptions.create(
                        model=self.model,
                        file=audio_file,
                        response_format="verbose_json",
                        language=kwargs.get("language", "ko")  # Korean default
                    )
                
                result = {
                    "text": response.text,
                    "language": response.language,
                    "duration": response.duration,
                    "segments": getattr(response, 'segments', []),
                    "confidence": 0.95  # Whisper doesn't provide confidence, use default
                }
                
                logger.info(f"Whisper transcription completed: {len(response.text)} characters")
                return result
                
            finally:
                # Clean up temporary file
                os.unlink(temp_audio_path)
                
        except Exception as e:
            logger.error(f"Whisper STT error: {e}")
            raise e

class AzureSTTProvider(STTProvider):
    """Azure Speech Services STT provider"""
    
    def __init__(self, api_key: str, region: str):
        self.api_key = api_key
        self.region = region
        self.speech_config = speechsdk.SpeechConfig(
            subscription=api_key,
            region=region
        )
        logger.info("Azure STT provider initialized")
    
    async def transcribe_audio(self, audio_data: bytes, **kwargs) -> Dict[str, Any]:
        """Transcribe audio using Azure Speech Services"""
        try:
            # Configure speech recognition
            self.speech_config.speech_recognition_language = kwargs.get("language", "ko-KR")
            
            # Create audio input from bytes
            audio_input = speechsdk.audio.PushAudioInputStream()
            audio_config = speechsdk.audio.AudioConfig(stream=audio_input)
            
            # Create speech recognizer
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )
            
            # Push audio data
            audio_input.write(audio_data)
            audio_input.close()
            
            # Recognize speech
            result = speech_recognizer.recognize_once()
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return {
                    "text": result.text,
                    "language": kwargs.get("language", "ko-KR"),
                    "confidence": result.confidence if hasattr(result, 'confidence') else 0.9
                }
            elif result.reason == speechsdk.ResultReason.NoMatch:
                return {
                    "text": "",
                    "language": kwargs.get("language", "ko-KR"),
                    "confidence": 0.0,
                    "error": "No speech detected"
                }
            else:
                raise Exception(f"Speech recognition failed: {result.reason}")
                
        except Exception as e:
            logger.error(f"Azure STT error: {e}")
            raise e

class TTSProvider:
    """Base TTS provider interface"""
    
    async def synthesize_speech(self, text: str, **kwargs) -> bytes:
        raise NotImplementedError

class ElevenLabsTTSProvider(TTSProvider):
    """ElevenLabs TTS provider"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = AsyncElevenLabs(api_key=api_key)
        logger.info("ElevenLabs TTS provider initialized")
    
    async def synthesize_speech(self, text: str, **kwargs) -> bytes:
        """Synthesize speech using ElevenLabs"""
        try:
            voice_id = kwargs.get("voice_id", "21m00Tcm4TlvDq8ikWAM")  # Default voice
            
            audio = await self.client.generate(
                text=text,
                voice=voice_id,
                model="eleven_multilingual_v2"
            )
            
            # Convert generator to bytes
            audio_bytes = b"".join(audio)
            
            logger.info(f"ElevenLabs synthesis completed: {len(text)} characters -> {len(audio_bytes)} bytes")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"ElevenLabs TTS error: {e}")
            raise e

class AzureTTSProvider(TTSProvider):
    """Azure Speech Services TTS provider"""
    
    def __init__(self, api_key: str, region: str):
        self.api_key = api_key
        self.region = region
        self.speech_config = speechsdk.SpeechConfig(
            subscription=api_key,
            region=region
        )
        logger.info("Azure TTS provider initialized")
    
    async def synthesize_speech(self, text: str, **kwargs) -> bytes:
        """Synthesize speech using Azure Speech Services"""
        try:
            # Configure voice
            voice_name = kwargs.get("voice_name", "ko-KR-SunHiNeural")
            self.speech_config.speech_synthesis_voice_name = voice_name
            
            # Create synthesizer
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=self.speech_config,
                audio_config=None
            )
            
            # Synthesize speech
            result = synthesizer.speak_text_async(text).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                logger.info(f"Azure TTS synthesis completed: {len(text)} characters")
                return result.audio_data
            else:
                raise Exception(f"Speech synthesis failed: {result.reason}")
                
        except Exception as e:
            logger.error(f"Azure TTS error: {e}")
            raise e

class AudioService:
    """Main audio service orchestrator"""
    
    def __init__(self, config: Dict[str, Any]):
        self.stt_providers = {}
        self.tts_providers = {}
        
        # Initialize STT providers
        if config.get("openai_api_key"):
            self.stt_providers["whisper"] = WhisperSTTProvider(config["openai_api_key"])
        
        if config.get("azure_speech_key") and config.get("azure_speech_region"):
            self.stt_providers["azure"] = AzureSTTProvider(
                config["azure_speech_key"],
                config["azure_speech_region"]
            )
        
        # Initialize TTS providers
        if config.get("elevenlabs_api_key"):
            self.tts_providers["elevenlabs"] = ElevenLabsTTSProvider(config["elevenlabs_api_key"])
        
        if config.get("azure_speech_key") and config.get("azure_speech_region"):
            self.tts_providers["azure"] = AzureTTSProvider(
                config["azure_speech_key"],
                config["azure_speech_region"]
            )
        
        self.default_stt = "whisper" if "whisper" in self.stt_providers else "azure"
        self.default_tts = "elevenlabs" if "elevenlabs" in self.tts_providers else "azure"
        
        logger.info(f"Audio service initialized with {len(self.stt_providers)} STT and {len(self.tts_providers)} TTS providers")
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        provider: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Transcribe audio to text"""
        
        provider_name = provider or self.default_stt
        
        if provider_name not in self.stt_providers:
            raise ValueError(f"STT provider {provider_name} not available")
        
        provider_instance = self.stt_providers[provider_name]
        
        try:
            result = await provider_instance.transcribe_audio(audio_data, **kwargs)
            result["provider"] = provider_name
            return result
            
        except Exception as e:
            logger.error(f"STT failed with {provider_name}: {e}")
            
            # Try fallback provider if available
            fallback_providers = [p for p in self.stt_providers.keys() if p != provider_name]
            if fallback_providers:
                logger.info(f"Trying fallback STT provider: {fallback_providers[0]}")
                fallback_result = await self.stt_providers[fallback_providers[0]].transcribe_audio(
                    audio_data, **kwargs
                )
                fallback_result["provider"] = fallback_providers[0]
                fallback_result["fallback"] = True
                return fallback_result
            
            raise e
    
    async def synthesize_speech(
        self,
        text: str,
        provider: Optional[str] = None,
        **kwargs
    ) -> bytes:
        """Synthesize text to speech"""
        
        provider_name = provider or self.default_tts
        
        if provider_name not in self.tts_providers:
            raise ValueError(f"TTS provider {provider_name} not available")
        
        provider_instance = self.tts_providers[provider_name]
        
        try:
            audio_data = await provider_instance.synthesize_speech(text, **kwargs)
            logger.info(f"TTS synthesis completed with {provider_name}")
            return audio_data
            
        except Exception as e:
            logger.error(f"TTS failed with {provider_name}: {e}")
            
            # Try fallback provider if available
            fallback_providers = [p for p in self.tts_providers.keys() if p != provider_name]
            if fallback_providers:
                logger.info(f"Trying fallback TTS provider: {fallback_providers[0]}")
                return await self.tts_providers[fallback_providers[0]].synthesize_speech(
                    text, **kwargs
                )
            
            raise e
    
    def process_audio_format(self, audio_data: bytes, target_format: str = "wav") -> bytes:
        """Convert audio to target format"""
        try:
            # Load audio using pydub
            audio = AudioSegment.from_file(BytesIO(audio_data))
            
            # Convert to target format
            output_buffer = BytesIO()
            audio.export(output_buffer, format=target_format)
            output_buffer.seek(0)
            
            return output_buffer.read()
            
        except Exception as e:
            logger.error(f"Audio format conversion error: {e}")
            return audio_data  # Return original if conversion fails
    
    def get_available_voices(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get available voices for TTS"""
        
        # This would be expanded based on each provider's voice catalog
        voices = {
            "elevenlabs": {
                "korean_female_1": {
                    "id": "21m00Tcm4TlvDq8ikWAM",
                    "name": "한국어 여성 1",
                    "language": "ko",
                    "gender": "female"
                },
                "korean_male_1": {
                    "id": "VR6AewLTigWG4xSOukaG", 
                    "name": "한국어 남성 1",
                    "language": "ko",
                    "gender": "male"
                }
            },
            "azure": {
                "ko-KR-SunHiNeural": {
                    "name": "선희 (여성)",
                    "language": "ko-KR",
                    "gender": "female"
                },
                "ko-KR-InJoonNeural": {
                    "name": "인준 (남성)",
                    "language": "ko-KR", 
                    "gender": "male"
                }
            }
        }
        
        if provider:
            return voices.get(provider, {})
        
        return voices