import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOJE_IP = "172.20.10.13"; 
const API_URL = `http://${MOJE_IP}:8000`;
const KCAL_PER_STEP = 0.04;

export default function HomeScreen() {
  const router = useRouter();
  const stepGoal = 10000;

  const [data, setData] = useState<{ 
    next: any, 
    last: any, 
    steps: number,
    todayCalories: number,
    todayMinutes: number,
    streak: number // Dodajemy stan dla streaka
  }>({
    next: null,
    last: null,
    steps: 0,
    todayCalories: 0,
    todayMinutes: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);

  // FUNKCJA OBLICZAJĄCA STREAK
  const calculateStreak = (allWeeks: any[], currentSteps: number) => {
    let streak = 0;
    
    // Tworzymy jedną długą listę kroków ze wszystkich tygodni
    // Od najnowszych do najstarszych
    let allDaysSteps: number[] = [];
    [...allWeeks].reverse().forEach(week => {
      if (week.dzienne_kroki) {
        // Odwracamy dni w tygodniu, żeby iść od wczoraj wstecz
        allDaysSteps.push(...[...week.dzienne_kroki].reverse());
      }
    });

    // Sprawdzamy dzisiejszy dzień
    const todayAchieved = currentSteps >= stepGoal;
    
    // Pobieramy indeks "wczoraj" (bo dzisiaj to pierwszy element allDaysSteps jeśli dane są świeże)
    // Ale prościej: iterujemy po liście wszystkich dni od wczoraj wstecz
    // Zakładamy, że pierwszy element w allDaysSteps to ostatni dzień z bazy (wczoraj)
    
    if (todayAchieved) streak = 1;

    for (let s of allDaysSteps) {
      if (s >= stepGoal) {
        if (streak > 0 || todayAchieved) {
             // Jeśli dzisiaj zrobione, dodajemy kolejne dni
             // Jeśli dzisiaj nie zrobione, ale sprawdzamy historię - streak i tak liczony od dzisiaj
        }
        streak++;
      } else {
        // Przerwanie ciągu
        break;
      }
    }
    return streak;
  };

  const fetchData = async () => {
    try {
      const [resPlans, resHist, resStats, pedoStatus] = await Promise.all([
        fetch(`${API_URL}/pobierz-plany`),
        fetch(`${API_URL}/aktywnosci`),
        fetch(`${API_URL}/statystyki`), 
        Pedometer.isAvailableAsync()
      ]);

      const plans = await resPlans.json();
      const history = await resHist.json();
      const stats = await resStats.json();
      
      let currentSteps = 0;
      if (pedoStatus) {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const result = await Pedometer.getStepCountAsync(start, new Date());
        currentSteps = result.steps;

        fetch(`${API_URL}/aktualizuj-kroki`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            count: currentSteps, 
            date: new Date().toISOString().split('T')[0] 
          }),
        }).catch(e => console.log("Sync error:", e));
      }

      // Obliczanie streaka na podstawie danych z bazy i dzisiejszych kroków
      const currentStreak = calculateStreak(stats, currentSteps);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayTimestamp = new Date().setHours(0,0,0,0);

      const latestStats = stats && stats.length > 0 ? stats[stats.length - 1] : null;
      const dayIndex = (new Date().getDay() + 6) % 7; 
      const workoutKcalToday = latestStats?.dzienne_kalorie ? latestStats.dzienne_kalorie[dayIndex] : 0;
      const stepsKcalToday = Math.round(currentSteps * KCAL_PER_STEP);
      const totalKcalToday = workoutKcalToday + stepsKcalToday;

      const todayActivities = Array.isArray(history) ? history.filter((a: any) => a.date === todayStr) : [];
      const minsToday = todayActivities.reduce((acc, curr) => acc + (curr.duration || 0), 0);

      const next = Array.isArray(plans) ? plans
        .filter((w: any) => new Date(w.date).getTime() >= todayTimestamp)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] : null;

      const last = Array.isArray(history) ? history
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;

      setData({ 
        next, 
        last, 
        steps: currentSteps,
        todayCalories: totalKcalToday,
        todayMinutes: minsToday,
        streak: currentStreak
      });
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const progressPercent = Math.min((data.steps / stepGoal) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* NAGŁÓWEK ZE STREAKIEM */}
      <View style={styles.topHeader}>
        <View style={styles.streakContainer}>
          <Image 
            source={require('../../assets/images/fire.png')} 
            style={styles.fireIcon} 
          />
          <Text style={styles.streakText}>{data.streak}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Twoja aktywność dzisiaj:</Text>
        {/* ... reszta Twojego kodu ... */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/steps')} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepCount}>{data.steps.toLocaleString()}</Text>
            <Text style={styles.stepGoalText}>/ {stepGoal.toLocaleString()} kroków</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </TouchableOpacity>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{data.todayCalories}</Text>
            <Text style={styles.summaryLabel}>ŁĄCZNIE KCAL</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{data.todayMinutes}</Text>
            <Text style={styles.summaryLabel}>MINUTY</Text>
          </View>
        </View>

        <View style={styles.gap} />
        
        <Text style={styles.label}>Twój najbliższy plan:</Text>
        {loading ? <ActivityIndicator color="#8f0c0c" /> : data.next ? (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: "/workoutdet", params: { isDone: "false" } })}
          >
            <BlurView tint="dark" intensity={90} style={styles.card}>
              <Text style={styles.cardTitle}>{data.next.activity}</Text>
              <Text style={styles.cardSub}>{data.next.date} • {data.next.time}</Text>
              <Text style={styles.moreInfo}>Pokaż szczegóły →</Text>
            </BlurView>
          </TouchableOpacity>
        ) : <View style={styles.empty}><Text style={styles.emptyText}>Brak planów.</Text></View>}

        <View style={styles.gap} />

        <Text style={styles.label}>Ostatnio wykonane:</Text>
        {data.last ? (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: "/workoutdet", params: { isDone: "true" } })}
          >
            <View style={styles.cardSolid}>
              <Text style={[styles.cardTitle, { fontSize: 22 }]}>{data.last.activity}</Text>
              <Text style={styles.cardSub}>{data.last.date}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>{data.last.calories} kcal</Text>
                <Text style={styles.statText}>{data.last.duration} min</Text>
              </View>
              <Text style={styles.moreInfo}>Pokaż szczegóły →</Text>
            </View>
          </TouchableOpacity>
        ) : <View style={styles.empty}><Text style={styles.emptyText}>Brak historii aktywności.</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  topHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 10 },
  streakContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  fireIcon: { width: 20, height: 30, marginRight: 5 },
  streakText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  content: { paddingHorizontal: 20, paddingTop: 35, paddingBottom: 40 },
  label: { color: '#666', marginBottom: 15, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  gap: { height: 40 },
  stepCard: { padding: 25, borderRadius: 25, backgroundColor: '#161616', borderWidth: 1, borderColor: '#333' },
  stepHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
  stepCount: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  stepGoalText: { fontSize: 14, color: '#666', marginLeft: 8 },
  progressTrack: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#df1b1b', borderRadius: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 },
  summaryBox: { flex: 1, backgroundColor: '#161616', padding: 20, borderRadius: 22, borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  summaryValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: '#df1b1b', fontSize: 10, marginTop: 4, fontWeight: '800', letterSpacing: 1 },
  card: { padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  cardSolid: { padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#222', backgroundColor: '#111' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#b5b5b5' },
  cardSub: { fontSize: 16, color: '#666', marginTop: 5 },
  moreInfo: { color: '#df1b1b', fontSize: 13, fontWeight: 'bold', marginTop: 20 },
  statsRow: { flexDirection: 'row', marginTop: 15, gap: 20 },
  statText: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  empty: { padding: 30, borderRadius: 25, borderWidth: 1, borderStyle: 'dashed', borderColor: '#333', alignItems: 'center' },
  emptyText: { color: '#444' }
});