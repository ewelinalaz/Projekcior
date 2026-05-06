import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

const ACTIVITIES = ['Siłownia', 'Bieganie', 'Joga', 'Basen', 'Rower', 'Spacer', 'Crossfit'];

export default function PlanerScreen() {
  const router = useRouter();
  const mojeIP = "172.20.10.13";
  const [form, setForm] = useState({
    activity: '',
    time: '',
    notes: '',
    date: new Date()
  });

  const [showPicker, setShowPicker] = useState(false);
  const [sugs, setSugs] = useState<string[]>([]);
  const updateForm = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const handleType = (text: string) => {
    updateForm('activity', text);
    setSugs(text.length > 0 ? ACTIVITIES.filter(a => a.toLowerCase().includes(text.toLowerCase())) : []);
  };

  const handleSave = async () => {
    const { activity, time, date, notes } = form;
  
    try {
      const res = await fetch(`http://${mojeIP}:8000/zaplanuj`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          activity, 
          time, 
          date: date.toISOString().split('T')[0], 
          notes 
        }),
      });
      if (res.ok) {
        Alert.alert("Sukces", "Zaplanowano!", [{ text: "OK", onPress: () => router.push('/(tabs)') }]);
      }
    } catch (e) {
      Alert.alert("Błąd", "Brak połączenia.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.title}>Nowy Plan</Text>

            <Text style={styles.label}>AKTYWNOŚĆ</Text>
            <TextInput
              style={styles.input}
              value={form.activity}
              onChangeText={handleType}
              placeholder="Np. Siłownia"
              placeholderTextColor="#444"
            />

            {sugs.map((s, i) => (
              <TouchableOpacity key={i} style={styles.sug} onPress={() => { updateForm('activity', s); setSugs([]); Keyboard.dismiss(); }}>
                <Text style={{ color: '#888' }}>{s}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>DATA:</Text>
            <TouchableOpacity style={styles.input} onPress={() => { Keyboard.dismiss(); setShowPicker(true); }}>
              <Text style={{ color: '#FFF' }}>{form.date.toLocaleDateString('pl-PL')}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={form.date}
                mode="date"
                display="default"
                onChange={(_, d) => { setShowPicker(false); if (d) updateForm('date', d); }}
              />
            )}

            <Text style={styles.label}>GODZINA:</Text>
            <TextInput
              style={styles.input}
              value={form.time}
              onChangeText={t => updateForm('time', t)}
              placeholder="Godzina (np. 18:00)"
              placeholderTextColor="#444"
            />

            <Text style={styles.label}>NOTATKI:</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              multiline
              value={form.notes}
              onChangeText={t => updateForm('notes', t)}
              placeholder="Szczegóły treningu..."
              placeholderTextColor="#444"
            />

            <TouchableOpacity style={styles.btn} onPress={handleSave}>
              <Text style={styles.btnText}>ZAPISZ</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a7a7a7', textAlign: 'center', marginBottom: 50, marginTop: 20,},
  label: { color: '#d20e0e', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#161616', padding: 18, borderRadius: 15, color: '#FFF', marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  sug: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  btn: { backgroundColor: '#610101', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10, },
  btnText: { color: '#a7a7a7', fontWeight: 'bold', fontSize: 16 }
});