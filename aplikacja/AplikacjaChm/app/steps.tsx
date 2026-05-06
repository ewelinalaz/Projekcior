import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOJE_IP = "172.20.10.13";
const STEP_TO_KM = 0.0007;
const STEP_TO_KCAL = 0.04;
const DAILY_GOAL = 10000;

export default function StepsScreen() {
  const [steps, setSteps] = useState({ past: 0, current: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isToday = useMemo(() => selectedDate.toDateString() === new Date().toDateString(), [selectedDate]);

  // SYNCHRONIZACJA Z BAZĄ
  const syncWithDB = async (count: number, date: Date) => {
    try {
      await fetch(`http://${MOJE_IP}:8000/aktualizuj-kroki`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, date: date.toISOString().split('T')[0] }),
      });
    } catch (e) { console.log("Sync error:", e); }
  };

  const fetchSteps = useCallback(async (date: Date) => {
    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);
    try {
      const result = await Pedometer.getStepCountAsync(start, end);
      setSteps({ past: result.steps, current: 0 });
      syncWithDB(result.steps, date);
    } catch { setSteps({ past: 0, current: 0 }); }
  }, []);

  useEffect(() => {
    if (isToday) {
      const start = new Date(); start.setHours(0,0,0,0);
      Pedometer.getStepCountAsync(start, new Date()).then(result => {
        setSteps(s => ({ ...s, past: result.steps }));
        syncWithDB(result.steps, new Date());
      });
      const sub = Pedometer.watchStepCount(result => setSteps(s => ({ ...s, current: result.steps })));
      return () => sub?.remove();
    } else {
      fetchSteps(selectedDate);
    }
  }, [selectedDate, isToday]);

  const totalSteps = steps.past + steps.current;
  const progress = Math.min((totalSteps / DAILY_GOAL) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Aktywność</Text>
        
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}>
            <MaterialCommunityIcons name="chevron-left" size={40} color="#9c1414" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} disabled={isToday} style={{ opacity: isToday ? 0 : 1 }}>
            <MaterialCommunityIcons name="chevron-right" size={40} color="#9c1414" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{isToday ? "Dzisiaj" : selectedDate.toLocaleDateString('pl-PL')}</Text>
          <Text style={styles.stepValue}>{totalSteps.toLocaleString()}</Text>
          <View style={styles.barBg}><View style={[styles.barFill, { width: `${progress}%` }]} /></View>
          <Text style={styles.goal}>Cel: {DAILY_GOAL.toLocaleString()}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.mini}>
            <Text style={styles.miniL}>Dystans</Text>
            <Text style={styles.miniV}>{(totalSteps * STEP_TO_KM).toFixed(2)} km</Text>
          </View>
          <View style={styles.mini}>
            <Text style={styles.miniL}>Spalone</Text>
            <Text style={styles.miniV}>{(totalSteps * STEP_TO_KCAL).toFixed(0)} kcal</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 25, paddingTop: 40 },
  header: { color: '#a7a7a7', fontSize: 30, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  card: { backgroundColor: '#161616', padding: 30, borderRadius: 35, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  label: { color: '#666', textTransform: 'uppercase', fontSize: 13, marginBottom: 10 },
  stepValue: { color: '#FFF', fontSize: 60, fontWeight: 'bold' },
  barBg: { width: '100%', height: 8, backgroundColor: '#222', borderRadius: 4, marginTop: 25 },
  barFill: { height: '100%', backgroundColor: '#df1b1b', borderRadius: 4 },
  goal: { color: '#444', fontSize: 12, marginTop: 10 },
  infoRow: { flexDirection: 'row', gap: 15, marginTop: 20 },
  mini: { flex: 1, backgroundColor: '#161616', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  miniL: { color: '#666', fontSize: 10, textTransform: 'uppercase', marginBottom: 5 },
  miniV: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});