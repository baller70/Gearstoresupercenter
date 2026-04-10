'use client'

import { useState, useRef } from 'react'
import { Mic, X, MessageCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export function VoiceChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('Tap to speak with Blake')
  const [messages, setMessages] = useState<Message[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const voiceServerUrl = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3333'
    : 'https://kevins-mac-mini.tailc5323b.ts.net'

  const toggleRecording = async () => {
    if (isProcessing) return
    
    if (!isRecording) {
      if (typeof window !== 'undefined' && 
          window.location.protocol === 'http:' && 
          window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1') {
        setStatus('Error: Use localhost for microphone')
        alert('Microphone requires localhost or HTTPS.\n\nUse: http://localhost:3003')
        return
      }
      
      try {
        setStatus('Requesting microphone...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
        mediaRecorder.onstop = processAudio
        
        mediaRecorder.start()
        setIsRecording(true)
        setStatus('Listening... tap to stop')
      } catch (err: any) {
        console.error('Mic error:', err)
        setStatus('Mic error: ' + (err?.message || 'Denied'))
      }
    } else {
      mediaRecorderRef.current?.stop()
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
      setIsRecording(false)
      setIsProcessing(true)
      setStatus('Processing...')
    }
  }

  const processAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('mode', 'fast')
    formData.append('division', 'gear-store')
    
    try {
      setStatus('Transcribing...')
      const response = await fetch(`${voiceServerUrl}/process`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.error) {
        setStatus('Error: ' + data.error)
      } else {
        if (data.transcript) {
          setMessages(prev => [...prev, { role: 'user', text: data.transcript }])
        }
        if (data.response) {
          setMessages(prev => [...prev, { role: 'assistant', text: data.response }])
        }
        setStatus('Tap to speak')
      }
    } catch (err: any) {
      console.error('Process error:', err)
      setStatus('Connection error')
    }
    
    setIsProcessing(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-50"
        title="Talk to Blake"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold">Blake</div>
            <div className="text-violet-100 text-xs">Gear Store Assistant</div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tap the mic to ask about<br/>products, orders, or design</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-violet-100 text-violet-900 ml-8'
                    : 'bg-white border border-gray-200 mr-8'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${msg.role === 'user' ? 'text-violet-700' : 'text-gray-500'}`}>
                  {msg.role === 'user' ? 'You' : 'Blake'}
                </div>
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center mb-3">{status}</div>
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-wait'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}
        >
          <Mic className="w-5 h-5" />
          {isRecording ? 'Stop Recording' : isProcessing ? 'Processing...' : 'Speak'}
        </button>
      </div>
    </div>
  )
}
