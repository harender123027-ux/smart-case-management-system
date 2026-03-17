/**
 * Voice Service to handle Speech-to-Text using Web Speech API
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // We want it to stop after one phrase for now
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // Default, can be updated
    }
  }

  isSupported() {
    return !!SpeechRecognition;
  }

  setLanguage(langCode) {
    if (!this.recognition) return;
    // Map internal language codes to BCP 47
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN'
    };
    this.recognition.lang = langMap[langCode] || langCode;
  }

  startListening(onResult, onError, onEnd) {
    if (!this.recognition) {
      onError('Speech Recognition not supported in this browser');
      return;
    }

    if (this.isListening) return;

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err) {
      onError(err.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export default new VoiceService();
