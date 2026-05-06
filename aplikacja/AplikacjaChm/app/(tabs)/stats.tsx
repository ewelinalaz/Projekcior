import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [allWeeks, setAllWeeks] = useState<any[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [stats, setStats] = useState({
    totalCalories: 0,
    count: 0,
    totalDuration: 0,
    daily: [0, 0, 0, 0, 0, 0, 0]
  });

  const mojeIP = "172.20.10.13";

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://${mojeIP}:8000/statystyki`);
      const data = await response.json();

      if (data && data.length > 0) {
        setAllWeeks(data);
        setCurrentWeekIndex(data.length - 1);

        const sumaKcal = data.reduce((acc: number, w: any) => acc + w.kalorie, 0);
        const sumaTreningow = data.reduce((acc: number, w: any) => acc + w.ilosc, 0);
        const sumaCzasu = data.reduce((acc: number, w: any) => acc + (w.czas || 0), 0);

        const latestWeek = data[data.length - 1];
        setStats({
          totalCalories: sumaKcal,
          count: sumaTreningow,
          totalDuration: sumaCzasu,
          daily: latestWeek.dzienne_kalorie
        });
      }
    } catch (e) {
      console.log("Błąd połączenia:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const changeWeek = (direction: number) => {
    const newIndex = currentWeekIndex + direction;
    if (newIndex >= 0 && newIndex < allWeeks.length) {
      setCurrentWeekIndex(newIndex);
      setStats(prev => ({
        ...prev,
        daily: allWeeks[newIndex].dzienne_kalorie
      }));
    }
  };

  const getBarHeight = (value: number) => {
    const maxCal = Math.max(...stats.daily, 1000);
    return `${(value / maxCal) * 100}%`;
  };

  const getComparison = () => {
    if (currentWeekIndex <= 0 || allWeeks.length < 2) return null;

    const current = allWeeks[currentWeekIndex];
    const previous = allWeeks[currentWeekIndex - 1];

    const currentDuration = current.czas || 0;
    const previousDuration = previous.czas || 0;

    if (previousDuration === 0) return null;

    const diff = ((currentDuration - previousDuration) / previousDuration) * 100;
    const isPositive = diff >= 0;

    return {
      percent: Math.abs(Math.round(diff)),
      isPositive,
      text: isPositive ? "więcej" : "mniej"
    };
  };

  const comparison = getComparison();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {loading ? (
        <View style={styles.loadingWrapper}><ActivityIndicator color="#ff0000" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Wyniki</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalCalories}</Text>
              <Text style={styles.statLabel}>kcal suma</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.count}</Text>
              <Text style={styles.statLabel}>treningi</Text>
            </View>
          </View>

          <View style={styles.wideBox}>
            <Text style={styles.statValue}>{stats.totalDuration} min</Text>
            <Text style={styles.statLabel}>czas łączny</Text>
          </View>

          <View style={styles.weekNavigation}>
            <TouchableOpacity onPress={() => changeWeek(-1)} disabled={currentWeekIndex === 0}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={32}
                color={currentWeekIndex === 0 ? "#333" : "#ff0000"}
              />
            </TouchableOpacity>

            <Text style={styles.subtitle}>
              {allWeeks[currentWeekIndex]?.tydzien || "Spalone kalorie"}
            </Text>

            <TouchableOpacity onPress={() => changeWeek(1)} disabled={currentWeekIndex === allWeeks.length - 1}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={32}
                color={currentWeekIndex === allWeeks.length - 1 ? "#333" : "#ff0000"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            {stats.daily.map((val, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={[styles.bar, { height: getBarHeight(val) as any }]} />
                <Text style={styles.dayLabel}>
                  {['P', 'W', 'Ś', 'C', 'P', 'S', 'N'][index]}
                </Text>
              </View>
            ))}
          </View>

          {/* Sekcja Porównania - tylko napis w ramce */}
          {comparison && (
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonText}>
                W tym tygodniu trenowałaś o{" "}
                <Text style={{ fontWeight: 'bold', color: comparison.isPositive ? "#4ade80" : "#ef4444" }}>
                  {comparison.percent}% {comparison.text}
                </Text>{" "}
                niż w zeszłym.
              </Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#a7a7a7', textAlign: 'center', marginBottom: 50, marginTop: 50},
  weekNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 20 },
  subtitle: { color: '#a7a7a7', fontSize: 16, textAlign: 'center', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statBox: { backgroundColor: '#161616', width: '48%', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  wideBox: { backgroundColor: '#161616', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginBottom: 10 },
  statValue: { color: '#c22929', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 5 },
  
  chartContainer: { height: 200, backgroundColor: '#111', borderRadius: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', padding: 20, borderWidth: 2, borderColor: '#222', marginBottom: 20 },
  barWrapper: { alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: 12, backgroundColor: '#760909', borderRadius: 6, minHeight: 4 },
  dayLabel: { color: '#555', fontSize: 10, marginTop: 8 },

  comparisonCard: { 
    backgroundColor: '#161616', 
    padding: 18, 
    borderRadius: 20, 
    justifyContent: 'center',
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#222'
  },
  comparisonText: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22 }
});