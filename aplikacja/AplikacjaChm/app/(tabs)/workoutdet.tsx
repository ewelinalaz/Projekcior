import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const MOJE_IP = "172.20.10.13";

export default function WorkoutDetailsScreen() {
    const router = useRouter();
    const { isDone } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [dataList, setDataList] = useState<any[]>([]);
    
    // Stany do "odhaczania" treningu
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [kcalInput, setKcalInput] = useState('350');
    const [durationInput, setDurationInput] = useState('45');

    useEffect(() => {
        fetchData();
    }, [isDone]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const endpoint = isDone === "true" ? "aktywnosci" : "pobierz-plany";
            const response = await fetch(`http://${MOJE_IP}:8000/${endpoint}`);
            const data = await response.json();

            if (isDone === "true") {
                // Historia: od najnowszych
                setDataList(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } else {
                // Plany: od najwcześniejszych (najbliższych)
                setDataList(data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            }
        } catch (e) {
            console.log("Błąd pobierania:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsDone = async (item: any) => {
        const payload = {
            activity: item.activity,
            calories: parseInt(kcalInput) || 0,
            duration: parseInt(durationInput) || 0,
            date: new Date().toISOString().split('T')[0],
            notes: item.notes || ""
        };

        try {
            const response = await fetch(`http://${MOJE_IP}:8000/dodaj-aktywnosc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Alert.alert("Brawo! 💪", "Trening zapisany w historii.");
                setMarkingId(null);
                fetchData(); // Odśwież listę planów
            }
        } catch (e) {
            Alert.alert("Błąd", "Brak połączenia.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#ff0000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isDone === "true" ? "Twoja Historia" : "Nadchodzące Plany"}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator color="#ff0000" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {dataList.length > 0 ? dataList.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardMain}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activityTitle}>{item.activity}</Text>
                                    <Text style={styles.dateText}>
                                        {item.date} {item.time ? `• ${item.time}` : ''}
                                    </Text>
                                </View>
                                
                                {isDone === "true" ? (
                                    <View style={styles.statsRight}>
                                        <Text style={styles.kcalText}>{item.calories} kcal</Text>
                                        <Text style={styles.minText}>{item.duration} min</Text>
                                    </View>
                                ) : (
                                    markingId !== item.id && (
                                        <TouchableOpacity onPress={() => {
                                            setMarkingId(item.id || index.toString());
                                            setKcalInput('350');
                                            setDurationInput('45');
                                        }}>
                                            <Text style={styles.actionLink}>Oznacz jako zrobione</Text>
                                        </TouchableOpacity>
                                    )
                                )}
                            </View>

                            {/* Sekcja wpisywania wyników - pojawia się tylko po kliknięciu linku */}
                            {!isDone && markingId === (item.id || index.toString()) && (
                                <View style={styles.confirmSection}>
                                    <View style={styles.inputRow}>
                                        <View style={styles.inputWrap}>
                                            <Text style={styles.inputLabel}>KCAL</Text>
                                            <TextInput 
                                                style={styles.smallInput}
                                                value={kcalInput}
                                                onChangeText={setKcalInput}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.inputWrap}>
                                            <Text style={styles.inputLabel}>MINUTY</Text>
                                            <TextInput 
                                                style={styles.smallInput}
                                                value={durationInput}
                                                onChangeText={setDurationInput}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.confirmActions}>
                                        <TouchableOpacity onPress={() => setMarkingId(null)}>
                                            <Text style={styles.cancelBtn}>Anuluj</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleMarkAsDone(item)}>
                                            <Text style={styles.confirmBtn}>Zatwierdź i zapisz</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {item.notes && !markingId && (
                                <Text style={styles.notesText}>{item.notes}</Text>
                            )}
                        </View>
                    )) : (
                        <Text style={styles.emptyText}>Brak pozycji na liście.</Text>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#111' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
    listContainer: { padding: 20 },
    card: { backgroundColor: '#161616', padding: 20, borderRadius: 25, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
    cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activityTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    dateText: { color: '#666', fontSize: 13, marginTop: 4 },
    
    // Widok Historii
    statsRight: { alignItems: 'flex-end' },
    kcalText: { color: '#ff0000', fontSize: 18, fontWeight: '900' },
    minText: { color: '#888', fontSize: 12 },
    
    // Widok Planu
    actionLink: { color: '#ff0000', fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
    
    // Sekcja potwierdzania (małe inputy)
    confirmSection: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#222' },
    inputRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    inputWrap: { flex: 1 },
    inputLabel: { color: '#444', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
    smallInput: { backgroundColor: '#000', color: '#FFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333', textAlign: 'center', fontWeight: 'bold' },
    confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
    cancelBtn: { color: '#666', fontSize: 14 },
    confirmBtn: { color: '#ff0000', fontSize: 14, fontWeight: 'bold' },
    
    notesText: { color: '#444', fontSize: 12, fontStyle: 'italic', marginTop: 10 },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 50 }
});