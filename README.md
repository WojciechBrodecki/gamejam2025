# Casino - Gra Losowa z Pulą

Aplikacja kasynowa z grą losową opartą na rundach. Gracze online dokładają się do puli, a na końcu rundy losowany jest zwycięzca, który zgarnia całą pulę minus prowizja kasynowa.

## 🎰 Funkcjonalności

- **Gra w rundach** - każda runda trwa konfigurowalny czas (domyślnie 60 sekund)
- **System zakładów** - gracze mogą stawiać dowolne kwoty w trakcie rundy
- **Losowanie ważone** - im więcej gracz postawi, tym większa szansa na wygraną
- **Prowizja kasynowa** - konfigurowalna prowizja pobierana od wygranej
- **Real-time** - komunikacja przez WebSocket
- **Persystencja** - dane w MongoDB

## 🛠️ Technologie

### Backend
- Node.js + TypeScript
- Express.js
- WebSocket (ws)
- MongoDB + Mongoose
- Webpack

### Frontend
- React 18 + TypeScript
- Custom hooks dla WebSocket
- Webpack
- CSS3 z animacjami

## 📁 Struktura projektu

```
gamejam2025/
├── backend/
│   ├── src/
│   │   ├── models/          # Modele Mongoose
│   │   ├── routes/          # Endpointy REST API
│   │   ├── services/        # Logika biznesowa
│   │   ├── config.ts        # Konfiguracja
│   │   └── index.ts         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
├── frontend/
│   ├── src/
│   │   ├── hooks/           # Custom React hooks
│   │   ├── App.tsx          # Główny komponent
│   │   ├── index.tsx        # Entry point
│   │   ├── types.ts         # Typy TypeScript
│   │   └── styles.css       # Style
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
├── shared/
│   └── types.ts             # Współdzielone typy
├── ecosystem.config.js      # Konfiguracja PM2
└── README.md
```

## 🚀 Uruchomienie

### Wymagania
- Node.js 18+
- MongoDB 6+
- npm lub yarn

### Instalacja zależności

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Konfiguracja

Skopiuj plik `.env.example` do `.env` w folderze backend i dostosuj wartości:

```bash
cd backend
cp .env.example .env
```

Dostępne zmienne:
- `PORT` - port serwera (domyślnie 3001)
- `MONGODB_URI` - URI do MongoDB
- `ROUND_DURATION_MS` - czas trwania rundy w ms (domyślnie 60000)
- `CASINO_COMMISSION_PERCENT` - prowizja kasynowa w % (domyślnie 5)
- `MIN_BET` - minimalny zakład
- `MAX_BET` - maksymalny zakład

### Development

Terminal 1 - Backend:
```bash
cd backend
npm run start:dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Frontend będzie dostępny na `http://localhost:3000`

### Production build

```bash
# Build backendu
cd backend
npm run build

# Build frontendu
cd ../frontend
npm run build
```

### Uruchomienie z PM2

```bash
# Instalacja PM2 globalnie (jeśli nie masz)
npm install -g pm2

# Uruchomienie obu aplikacji
pm2 start ecosystem.config.js

# Sprawdzenie statusu
pm2 status

# Logi
pm2 logs

# Restart
pm2 restart all

# Stop
pm2 stop all
```

## 📡 API

### REST Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/health` | Health check |
| GET | `/api/game/state` | Aktualny stan gry |
| GET | `/api/player/:id` | Informacje o graczu |
| POST | `/api/player` | Utworzenie nowego gracza |

### WebSocket Events

**Klient → Serwer:**
- `JOIN_GAME` - dołączenie do gry
- `PLACE_BET` - postawienie zakładu
- `SYNC_STATE` - synchronizacja stanu

**Serwer → Klient:**
- `ROUND_START` - rozpoczęcie rundy
- `ROUND_UPDATE` - aktualizacja rundy
- `ROUND_END` - zakończenie rundy
- `BET_PLACED` - zakład został postawiony
- `PLAYER_JOINED` - gracz dołączył
- `PLAYER_LEFT` - gracz wyszedł
- `SYNC_STATE` - pełen stan gry
- `ERROR` - błąd

## 🎮 Zasady gry

1. Każda runda trwa określony czas (domyślnie 60 sekund)
2. Gracze mogą stawiać zakłady w trakcie trwania rundy
3. Im więcej gracz postawi, tym większa jego szansa na wygraną
4. Po zakończeniu rundy losowany jest zwycięzca
5. Zwycięzca otrzymuje całą pulę minus prowizja kasynowa
6. Nowa runda rozpoczyna się automatycznie po 5 sekundach

## 📝 Licencja

MIT
