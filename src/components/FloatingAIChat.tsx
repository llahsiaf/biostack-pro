import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Settings,
  Key,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBioStackStore } from '../store/useBioStackStore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const FloatingAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');

  const { inventory, freezerItems } = useBioStackStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo! Saya BioStack AI Assistant. Tanyakan apa saja seputar dosis peptida, kalkulasi pelarutan BAC water, waktu paruh, atau protokol rotasi injeksi Anda.',
      time: '00:00',
    },
  ]);

  useEffect(() => {
    AsyncStorage.getItem('@biostack_api_key').then((val) => {
      if (val) setApiKey(val);
    });
    AsyncStorage.getItem('@biostack_ai_provider').then((val) => {
      if (val === 'gemini' || val === 'openai') setAiProvider(val);
    });
  }, []);

  const saveSettings = async () => {
    await AsyncStorage.setItem('@biostack_api_key', apiKey.trim());
    await AsyncStorage.setItem('@biostack_ai_provider', aiProvider);
    setIsSettingsOpen(false);
    Alert.alert('Sukses', 'Pengaturan API Key berhasil disimpan!');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: timeNow,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      let replyText = '';

      if (apiKey.trim()) {
        // Panggil API Online (Gemini / OpenAI)
        if (aiProvider === 'gemini') {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Anda adalah konsultan biohacking dan farmakologi peptida profesional untuk aplikasi BioStack PRO. Jawab secara ringkas, berbasis sains klinis, gunakan bahasa Indonesia yang jelas. Pertanyaan pengguna: "${userText}"`,
                      },
                    ],
                  },
                ],
              }),
            }
          );
          const data = await response.json();
          replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak mendapat respon dari Gemini API.';
        } else {
          // OpenAI API
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'Anda adalah asisten cerdas farmakologi peptida dan protokol subkutan BioStack PRO. Jawab ringkas dan edukatif.',
                },
                { role: 'user', content: userText },
              ],
            }),
          });
          const data = await response.json();
          replyText = data?.choices?.[0]?.message?.content || 'Maaf, tidak mendapat respon dari OpenAI.';
        }
      } else {
        // Fallback: Smart Engine Offline bawaan
        const lower = userText.toLowerCase();
        if (lower.includes('bac') || lower.includes('larut') || lower.includes('air')) {
          replyText = 'Panduan BAC Water: Masukkan Bacteriostatic Water secara perlahan menyusuri dinding kaca vial (jangan disemprot langsung ke serbuk peptida untuk mencegah denaturasi rantai asam amino).';
        } else if (lower.includes('rotasi') || lower.includes('titik') || lower.includes('suntik')) {
          replyText = 'Protokol Rotasi: Rotasikan 4 kuadran perut (RUQ, LUQ, RLQ, LLQ) minimal berjarak 2.5 cm dari bekas tusukan sebelumnya untuk menghindari penumpukan jaringan parut (lipohipertrofi).';
        } else if (lower.includes('bpc') || lower.includes('tb500')) {
          replyText = 'Protokol Regenerasi BPC-157: Dosis standar berkisar 250 - 500 mcg per hari via subkutan, sering dikombinasikan dengan TB-500 untuk penyembuhan ligamen dan tendon.';
        } else {
          replyText = `Catatan Pintar: Anda dapat memasukkan Google Gemini API Key gratis pada ikon gerigi (⚙️) di atas untuk konsultasi AI interaktif tanpa batas. Stok aktif kulkas Anda saat ini: ${inventory.length} vial.`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Gagal terhubung ke API. Pastikan API Key valid atau gunakan mode offline bawaan.',
          time: timeNow,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsOpen(true)}
        style={styles.floatingButton}
      >
        <Sparkles size={20} color="#022c22" />
      </TouchableOpacity>

      {/* Main Chat Modal */}
      <Modal visible={isOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.chatCard}>
            {/* Chat Top Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerTitleRow}>
                <View style={styles.botIconWrap}>
                  <Bot size={18} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>BioStack AI Expert</Text>
                  <Text style={styles.headerSubtitle}>
                    {apiKey ? `Connected (${aiProvider.toUpperCase()})` : 'Offline Knowledge Mode'}
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={styles.iconBtn}>
                  <Settings size={18} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.iconBtn}>
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Chat Messages */}
            <ScrollView
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubble,
                    m.sender === 'user' ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      m.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                    ]}
                  >
                    {m.text}
                  </Text>
                  <Text style={styles.messageTime}>{m.time}</Text>
                </View>
              ))}
              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={styles.loadingText}>Menyiapkan respon klinis...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Tanya seputar dosis atau peptida..."
                placeholderTextColor="#64748b"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                disabled={isLoading || !inputText.trim()}
                onPress={handleSendMessage}
                style={[
                  styles.sendBtn,
                  (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
                ]}
              >
                <Send size={15} color="#022c22" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings Modal (API Key Input) */}
      <Modal visible={isSettingsOpen} animationType="fade" transparent>
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <View style={styles.headerTitleRow}>
                <Key size={18} color="#10b981" />
                <Text style={styles.settingsTitle}>Pengaturan API Key</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsDesc}>
              Masukkan Google Gemini API Key gratis (atau OpenAI) Anda. Kunci ini hanya disimpan di memori HP Anda.
            </Text>

            <View style={styles.providerRow}>
              <TouchableOpacity
                onPress={() => setAiProvider('gemini')}
                style={[styles.providerBtn, aiProvider === 'gemini' && styles.providerBtnActive]}
              >
                <Text style={[styles.providerBtnText, aiProvider === 'gemini' && styles.providerBtnTextActive]}>
                  Google Gemini (Gratis)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAiProvider('openai')}
                style={[styles.providerBtn, aiProvider === 'openai' && styles.providerBtnActive]}
              >
                <Text style={[styles.providerBtnText, aiProvider === 'openai' && styles.providerBtnTextActive]}>
                  OpenAI ChatGPT
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.keyInput}
              placeholder="Tempel API Key di sini (AIzaSy...)"
              placeholderTextColor="#475569"
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              secureTextEntry
            />

            <TouchableOpacity onPress={saveSettings} style={styles.saveKeyBtn}>
              <Check size={16} color="#022c22" />
              <Text style={styles.saveKeyBtnText}>Simpan Pengaturan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  chatCard: {
    height: '82%',
    backgroundColor: '#090d16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 6,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    padding: 14,
    gap: 10,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#022c22',
    fontWeight: '600',
  },
  aiMessageText: {
    color: '#e2e8f0',
  },
  messageTime: {
    fontSize: 8,
    color: '#64748b',
    alignSelf: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#030712',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 12,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#1e293b',
  },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  settingsCard: {
    width: '100%',
    backgroundColor: '#090d16',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  settingsDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  providerBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  providerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  providerBtnTextActive: {
    color: '#34d399',
  },
  keyInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  saveKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  saveKeyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
});
