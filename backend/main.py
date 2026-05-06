from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from supabase import create_client, Client
import uvicorn

app = FastAPI()

# --- KONFIGURACJA SUPABASE ---
SUPABASE_URL = "https://c48wg1i2xaznc24zefhsmw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96YWZyb29tdGNndXZxZWVoZ2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjMzMDQsImV4cCI6MjA5MzMzOTMwNH0.OviaGcdxTJO6M-qRhV1WHAYwbZAz-_Iv4k1NK2qUxmE"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELE DANYCH ---
class Trening(BaseModel):
    activity: str
    calories: int
    duration: int
    date: str
    notes: Optional[str] = ""

class Plan(BaseModel):
    activity: str
    time: str
    date: str
    notes: Optional[str] = ""

class Kroki(BaseModel):
    count: int
    date: str

# --- ENDPOINTY ---

@app.post("/dodaj-aktywnosc")
def odbierz_trening(dane: Trening):
    try:
        data = dane.model_dump()
        response = supabase.table("treningi").insert(data).execute()
        return {"status": "Sukces!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/aktualizuj-kroki")
def aktualizuj_kroki(dane: Kroki):
    try:
        # Używamy upsert, aby jedna data miała tylko jeden wpis z liczbą kroków
        response = supabase.table("kroki").upsert({
            "count": dane.count,
            "date": dane.date
        }, on_conflict="date").execute()
        return {"status": "Kroki zsynchronizowane"}
    except Exception as e:
        print(f"Błąd kroków: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/statystyki")
def pobierz_statystyki():
    try:
        # 1. Pobierz treningi
        res_treningi = supabase.table("treningi").select("*").execute()
        # 2. Pobierz kroki
        res_kroki = supabase.table("kroki").select("*").execute()
        
        tygodnie = {}

        # Słownik pomocniczy do szybkiego dostępu do kroków po dacie
        kroki_dict = {item['date']: item['count'] for item in res_kroki.data}

        # Przetwarzanie treningów
        for t in res_treningi.data:
            try:
                data_obj = datetime.strptime(t['date'], '%Y-%m-%d')
                iso_year, iso_week, _ = data_obj.isocalendar()
                sort_key = f"{iso_year}-{iso_week:02d}"
                
                if sort_key not in tygodnie:
                    tygodnie[sort_key] = {
                        "tydzien": f"Tydzień {iso_week} ({iso_year})",
                        "kalorie": 0, 
                        "czas": 0, 
                        "ilosc": 0,
                        "dzienne_kalorie": [0] * 7, 
                        "dzienne_kroki": [0] * 7, # Dodane pole na kroki
                        "raw_sort": sort_key
                    }
                
                kcal = int(t.get('calories', 0))
                tygodnie[sort_key]["kalorie"] += kcal
                tygodnie[sort_key]["czas"] += int(t.get('duration', 0))
                tygodnie[sort_key]["ilosc"] += 1
                tygodnie[sort_key]["dzienne_kalorie"][data_obj.weekday()] += kcal
            except: continue

        # 3. Uzupełnianie kroków w tygodniach
        # Przechodzimy przez wszystkie zapisane dni z krokami
        for data_str, count in kroki_dict.items():
            try:
                data_obj = datetime.strptime(data_str, '%Y-%m-%d')
                iso_year, iso_week, _ = data_obj.isocalendar()
                sort_key = f"{iso_year}-{iso_week:02d}"

                # Jeśli tydzień nie istnieje w treningach, musimy go stworzyć dla samych kroków
                if sort_key not in tygodnie:
                    tygodnie[sort_key] = {
                        "tydzien": f"Tydzień {iso_week} ({iso_year})",
                        "kalorie": 0, "czas": 0, "ilosc": 0,
                        "dzienne_kalorie": [0] * 7, 
                        "dzienne_kroki": [0] * 7,
                        "raw_sort": sort_key
                    }
                
                tygodnie[sort_key]["dzienne_kroki"][data_obj.weekday()] = count
            except: continue

        posortowane = sorted(tygodnie.values(), key=lambda x: x['raw_sort'])
        for item in posortowane: item.pop('raw_sort', None)
        return posortowane

    except Exception as e:
        print(f"Błąd statystyk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Pozostałe endpointy bez zmian...
@app.get("/aktywnosci")
def pobierz_wszystkie_aktywnosci():
    response = supabase.table("treningi").select("*").execute()
    return response.data

@app.post("/zaplanuj")
def zaplanuj_trening(dane: Plan):
    supabase.table("plany").insert(dane.model_dump()).execute()
    return {"status": "Zaplanowano!"}

@app.get("/pobierz-plany")
def pobierz_plany():
    response = supabase.table("plany").select("*").execute()
    return response.data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)