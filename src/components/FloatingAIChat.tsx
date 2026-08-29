import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Bot, Sparkles, X, Send, User, ChevronRight } from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actionTitle?: string;
  suggestedDose?: number;
  peptideId?: string;
}

export const FloatingAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { inventory, freezerItems, updateActiveItem } = useBioStackStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo, saya BioStack AI Assistant. Anda dapat menanyakan panduan protokol peptida, sinergi penumpukan (stacking), aturan puasa, atau penyesuaian dosis.',
    },
  ]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      let aiReply = 'Berdasarkan protokol biohacking standar, pastikan waktu jeda makan 2 jam terpenuhi untuk secretagogue GH dan pantau toleransi sebelum menaikkan dosis.';
      let actionTitle: string | undefined;
      let suggestedDose: number | undefined;
      let peptideId: string | undefined;

      const lower = userText.toLowerCase();
      if (lower.includes('retatrutide') && lower.includes('dosis')) {
        const reta = inventory.find((i) => i.name.toLowerCase().includes('retatrutide'));
        if (reta) {
          const nextDose = Math.min(12, reta.selectedDose + 2);
          aiReply = `Retatrutide aktif Anda saat ini berada di dosis ${reta.selectedDose} mg. Jika sudah melewati 4 minggu dan toleransi gastrointestinal baik, Anda dapat titrasi ke ${nextDose} mg.`;
          actionTitle = `Tingkatkan Dosis ke ${nextDose} mg`;
          suggestedDose = nextDose;
          peptideId = reta.id;
        }
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: aiReply, actionTitle, suggestedDose, peptideId },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.fabContainer}>
        <View style={styles.fabInner}>
          <Bot size={22} color="#022c22" />
          <View style={styles.sparkleBadge}>
            <Sparkles size={10} color="#06b6d4" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Slide-Up Chat Modal */}
      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.backdrop}>
          <View style={styles.chatSheet}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.titleWrap}>
                <Bot size={18} color="#10b981" />
                <Text style={styles.chatTitle}>BioStack AI Consultation</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Message List */}
            <ScrollView style={styles.msgScroll} contentContainerStyle={styles.msgContainer}>
              {messages.map((m) => (
                <View key={m.id} style={[styles.msgRow, m.sender === 'user' ? styles.msgUser : styles.msgAI]}>
                  <View style={styles.msgIcon}>
                    {m.sender === 'user' ? <User size={12} color="#94a3b8" /> : <Bot size={12} color="#10b981" />}
                  </View>
                  <View style={[styles.msgBubble, m.sender === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                    <Text style={styles.msgText}>{m.text}</Text>
                    {m.actionTitle && m.suggestedDose && m.peptideId && (
                      <TouchableOpacity
                        onPress={() => {
                          updateActiveItem(m.peptideId!, { selectedDose: m.suggestedDose! });
                          setIsOpen(false);
                        }}
                        style={styles.actionCard}
                      >
                        <Text style={styles.actionCardText}>{m.actionTitle}</Text>
                        <ChevronRight size={12} color="#022c22" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              {loading && <ActivityIndicator color="#10b981" style={{ marginVertical: 8 }} />}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Tanyakan protokol peptida..."
                placeholderTextColor="#64748b"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                <Send size={16} color="#022c22" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: { position: 'absolute', bottom: 75, right: 16, zIndex: 99 },
  fabInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  sparkleBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#090d16', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#06b6d4' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  chatSheet: { backgroundColor: '#0b0f19', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#1e293b', height: '80%', padding: 14 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderColor: '#1e293b' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  msgScroll: { flex: 1, marginVertical: 8 },
  msgContainer: { gap: 10, paddingVertical: 4 },
  msgRow: { flexDirection: 'row', gap: 8, maxWidth: '88%' },
  msgUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAI: { alignSelf: 'flex-start' },
  msgIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  msgBubble: { padding: 10, borderRadius: 14 },
  bubbleUser: { backgroundColor: '#0284c7' },
  bubbleAI: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  msgText: { color: '#f1f5f9', fontSize: 12, lineHeight: 17 },
  actionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#10b981', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, marginTop: 8 },
  actionCardText: { fontSize: 10, fontWeight: '800', color: '#022c22' },
  inputBar: { flexDirection: 'row', gap: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#1e293b' },
  textInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 12 },
  sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
});
