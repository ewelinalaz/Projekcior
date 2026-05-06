import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const ACTIVITIES = ['Siłownia', 'Bieganie', 'Joga', 'Basen', 'Rower', 'Spacer', 'Crossfit'];

export default function AddWorkoutScreen() {
  const router = useRouter();
  const mojeIP = "172.20.10.13";
  
  const [form, setForm] = useState({
    activity: '',
    calories: '',
    duration: '',
    notes: '',
    date: new Date()
  });
  
  const [showPicker, setShowPicker] = useState(false);
  const [sugs, setSugs] = useState<string[]>([]);
  const updateForm = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleAdd = async () => {
    const { activity, calories, duration, notes, date } = form;
    
    if (!activity || !calories || !duration) {
      return Alert.alert("Błąd", "Wypełnij wszystkie pola!");
    }

    const payload = {
      activity,
      calories: parseInt(calories),
      duration: parseInt(duration),
      notes,
      date: date.toISOString().split('T')[0]
    };

    try {
      const res = await fetch(`http://${mojeIP}:8000/dodaj-aktywnosc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert("Sukces", "Trening zapisany!", [
          { text: "OK", onPress: () => router.push({ pathname: "/workoutdet", params: { ...payload, isDone: "true" } }) }
        ]);
      }
    } catch (e) {
      Alert.alert("Błąd", "Brak połączenia z serwerem.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
            <Text style={styles.title}>Dodaj Trening</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Data treningu:</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
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

              <Text style={styles.label}>Co trenowałeś?</Text>
              <TextInput 
                style={styles.input} 
                placeholder="np. Bieganie" 
                placeholderTextColor="#444" 
                value={form.activity} 
                onChangeText={(t) => {
                  updateForm('activity', t);
                  setSugs(t.length > 0 ? ACTIVITIES.filter(a => a.toLowerCase().includes(t.toLowerCase())) : []);
                }} 
              />

              {sugs.map((s, i) => (
                <TouchableOpacity key={i} style={styles.sug} onPress={() => { updateForm('activity', s); setSugs([]); Keyboard.dismiss(); }}>
                  <Text style={{ color: '#888' }}>{s}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.label}>Kalorie (kcal):</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor="#444" keyboardType="numeric" value={form.calories} onChangeText={t => updateForm('calories', t)} />

              <Text style={styles.label}>Czas (min):</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor="#444" keyboardType="numeric" value={form.duration} onChangeText={t => updateForm('duration', t)} />

              <Text style={styles.label}>Notatki:</Text>
              <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Opis..." placeholderTextColor="#444" multiline value={form.notes} onChangeText={t => updateForm('notes', t)} />

              <TouchableOpacity style={styles.button} onPress={handleAdd}>
                <Text style={styles.buttonText}>ZAPISZ I ZOBACZ SZCZEGÓŁY</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 25, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a7a7a7', textAlign: 'center', marginBottom: 50 },
  form: { backgroundColor: '#161616', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  label: { color: '#c10b0b', fontSize: 11, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#000', color: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  sug: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#111', borderRadius: 5, marginBottom: 5 },
  button: { backgroundColor: '#610101', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#a7a7a7', fontWeight: 'bold', fontSize: 16 }
});