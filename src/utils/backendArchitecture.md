# ArbLens Backend Infrastructure Architecture

## Overview
This document outlines the complete backend infrastructure for ArbLens - an AI-powered arbitrage detection platform that transforms the existing React frontend into a production-ready system with real-time data ingestion and processing.

## Architecture Components

### 1. FastAPI Backend Service
```python
# main.py - FastAPI Application
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
from typing import List, Optional

app = FastAPI(title="ArbLens API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Market data endpoints
@app.get("/api/v1/opportunities")
async def get_arbitrage_opportunities(
    min_spread: float = 1.0,
    min_liquidity: float = 1000,
    venues: Optional[List[str]] = None,
    db: Session = Depends(get_db)
):
    """Get current arbitrage opportunities with filtering"""
    # Implementation connects to Supabase via SQL
    pass

@app.post("/api/v1/backtests")
async def create_backtest(
    backtest_data: BacktestRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create and run historical backtest analysis"""
    # Queue backtest job for background processing
    background_tasks.add_task(process_backtest, backtest_data)
    pass

# Real-time WebSocket endpoint
@app.websocket("/ws/opportunities")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time opportunity updates"""
    await websocket.accept()
    # Stream real-time arbitrage opportunities
    pass
```

### 2. Market Adapter Services

#### Polymarket Adapter
```python
# adapters/polymarket_adapter.py
import aiohttp
import asyncio
from typing import Dict, List
from models.market import Market

class PolymarketAdapter:
    def __init__(self):
        self.base_url = "https://clob.polymarket.com"
        self.websocket_url = "wss://ws-subscriptions-clob.polymarket.com"
    
    async def fetch_markets(self) -> List[Market]:
        """Fetch active markets from Polymarket"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/markets") as response:
                data = await response.json()
                return [self.parse_market(market) for market in data]
    
    async def subscribe_to_updates(self, callback):
        """Subscribe to real-time price updates"""
        # WebSocket implementation for real-time data
        pass
    
    def parse_market(self, raw_data: Dict) -> Market:
        """Parse Polymarket API response to internal Market model"""
        return Market(
            external_id=raw_data['id'],
            title=raw_data['question'],
            venue_id=self.venue_id,
            yes_price=float(raw_data['yes_price']),
            no_price=float(raw_data['no_price']),
            yes_liquidity=float(raw_data['yes_liquidity']),
            no_liquidity=float(raw_data['no_liquidity'])
        )
```

#### Kalshi Adapter
```python
# adapters/kalshi_adapter.py
class KalshiAdapter:
    def __init__(self):
        self.base_url = "https://trading-api.kalshi.com"
        self.api_key = os.getenv("KALSHI_API_KEY")
    
    async def fetch_markets(self) -> List[Market]:
        """Fetch markets from Kalshi with authentication"""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        # Implementation similar to Polymarket but with auth
        pass
```

#### Manifold Markets Adapter
```python
# adapters/manifold_adapter.py
class ManifoldAdapter:
    def __init__(self):
        self.base_url = "https://api.manifold.markets"
    
    async def fetch_markets(self) -> List[Market]:
        """Fetch markets from Manifold (free API)"""
        # Implementation for Manifold's public API
        pass
```

#### Betfair Adapter
```python
# adapters/betfair_adapter.py
class BetfairAdapter:
    def __init__(self):
        self.base_url = "https://api.betfair.com"
        self.app_key = os.getenv("BETFAIR_APP_KEY")
    
    async def fetch_markets(self) -> List[Market]:
        """Fetch markets from Betfair Exchange"""
        # Implementation for Betfair API with session management
        pass
```

### 3. Data Ingestion Workers

```python
# workers/data_ingestion_worker.py
import asyncio
from celery import Celery
from adapters import PolymarketAdapter, KalshiAdapter, ManifoldAdapter, BetfairAdapter

# Celery configuration for background tasks
celery_app = Celery('arblens', broker='redis://localhost:6379')

class DataIngestionWorker:
    def __init__(self):
        self.adapters = {
            'polymarket': PolymarketAdapter(),
            'kalshi': KalshiAdapter(),
            'manifold': ManifoldAdapter(),
            'betfair': BetfairAdapter()
        }
    
    @celery_app.task
    async def sync_all_markets(self):
        """Sync markets from all venues"""
        tasks = []
        for venue_name, adapter in self.adapters.items():
            tasks.append(self.sync_venue_markets(venue_name, adapter))
        
        await asyncio.gather(*tasks)
    
    async def sync_venue_markets(self, venue_name: str, adapter):
        """Sync markets for a specific venue"""
        try:
            markets = await adapter.fetch_markets()
            await self.store_markets(venue_name, markets)
            print(f"Synced {len(markets)} markets from {venue_name}")
        except Exception as e:
            print(f"Error syncing {venue_name}: {e}")
    
    async def store_markets(self, venue_name: str, markets: List[Market]):
        """Store markets in Supabase database"""
        # Connect to Supabase and upsert market data
        pass

# Schedule periodic sync every 30 seconds
@celery_app.task
def periodic_market_sync():
    worker = DataIngestionWorker()
    asyncio.run(worker.sync_all_markets())
```

### 4. Arbitrage Calculation Engine

```python
# engines/arbitrage_engine.py
from typing import List, Tuple
import numpy as np
from models.market import Market
from models.arbitrage_opportunity import ArbitrageOpportunity

class ArbitrageEngine:
    def __init__(self, min_spread: float = 0.01, min_liquidity: float = 1000):
        self.min_spread = min_spread
        self.min_liquidity = min_liquidity
    
    def find_opportunities(self, markets: List[Market]) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities across all market pairs"""
        opportunities = []
        
        # Group markets by similar questions using ML similarity
        market_groups = self.group_similar_markets(markets)
        
        for group in market_groups:
            if len(group) < 2:
                continue
                
            # Calculate opportunities within each group
            group_opportunities = self.calculate_group_opportunities(group)
            opportunities.extend(group_opportunities)
        
        return sorted(opportunities, key=lambda x: x.net_spread_pct, reverse=True)
    
    def group_similar_markets(self, markets: List[Market]) -> List[List[Market]]:
        """Group markets with similar questions using NLP similarity"""
        # Implementation using sentence transformers or similar
        from sentence_transformers import SentenceTransformer
        
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create embeddings for market titles
        titles = [market.title for market in markets]
        embeddings = model.encode(titles)
        
        # Cluster similar markets (simplified clustering)
        from sklearn.cluster import DBSCAN
        clustering = DBSCAN(eps=0.3, min_samples=2).fit(embeddings)
        
        groups = {}
        for idx, label in enumerate(clustering.labels_):
            if label not in groups:
                groups[label] = []
            groups[label].append(markets[idx])
        
        return list(groups.values())
    
    def calculate_group_opportunities(self, markets: List[Market]) -> List[ArbitrageOpportunity]:
        """Calculate arbitrage opportunities within a group of similar markets"""
        opportunities = []
        
        for i, market_a in enumerate(markets):
            for market_b in markets[i+1:]:
                opportunity = self.calculate_pair_opportunity(market_a, market_b)
                if opportunity and opportunity.net_spread_pct >= self.min_spread:
                    opportunities.append(opportunity)
        
        return opportunities
    
    def calculate_pair_opportunity(self, market_a: Market, market_b: Market) -> ArbitrageOpportunity:
        """Calculate arbitrage opportunity between two markets"""
        # Calculate all possible arbitrage combinations
        combinations = [
            # Buy Yes on A, Sell Yes on B
            {
                'buy_venue': market_a,
                'sell_venue': market_b,
                'buy_side': 'yes',
                'sell_side': 'yes',
                'buy_price': market_a.yes_price,
                'sell_price': market_b.yes_price,
                'buy_liquidity': market_a.yes_liquidity,
                'sell_liquidity': market_b.yes_liquidity
            },
            # Buy No on A, Sell No on B
            {
                'buy_venue': market_a,
                'sell_venue': market_b,
                'buy_side': 'no',
                'sell_side': 'no',
                'buy_price': market_a.no_price,
                'sell_price': market_b.no_price,
                'buy_liquidity': market_a.no_liquidity,
                'sell_liquidity': market_b.no_liquidity
            },
            # Additional combinations for opposite sides
        ]
        
        best_opportunity = None
        max_spread = 0
        
        for combo in combinations:
            spread = combo['sell_price'] - combo['buy_price']
            if spread > max_spread:
                max_spread = spread
                best_opportunity = combo
        
        if not best_opportunity or max_spread <= 0:
            return None
        
        # Calculate fees and net spread
        fee_a = market_a.venue.fee_bps / 10000
        fee_b = market_b.venue.fee_bps / 10000
        
        gross_spread_pct = (max_spread / best_opportunity['buy_price']) * 100
        net_spread_pct = gross_spread_pct - (fee_a + fee_b) * 100
        
        # Calculate max tradable amount based on liquidity
        max_tradable = min(
            best_opportunity['buy_liquidity'],
            best_opportunity['sell_liquidity']
        )
        
        if max_tradable < self.min_liquidity:
            return None
        
        expected_profit_usd = (net_spread_pct / 100) * max_tradable
        
        return ArbitrageOpportunity(
            market_a_id=market_a.id,
            market_b_id=market_b.id,
            venue_a_side=best_opportunity['buy_side'],
            venue_b_side=best_opportunity['sell_side'],
            venue_a_price=best_opportunity['buy_price'],
            venue_b_price=best_opportunity['sell_price'],
            gross_spread_pct=gross_spread_pct,
            net_spread_pct=net_spread_pct,
            expected_profit_pct=net_spread_pct,
            expected_profit_usd=expected_profit_usd,
            max_tradable_amount=max_tradable,
            venue_a_liquidity=best_opportunity['buy_liquidity'],
            venue_b_liquidity=best_opportunity['sell_liquidity']
        )
```

### 5. Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/arblens
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  worker:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/arblens
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    command: celery -A workers.data_ingestion_worker worker --loglevel=info

  scheduler:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/arblens
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    command: celery -A workers.data_ingestion_worker beat --loglevel=info

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=arblens
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api

volumes:
  postgres_data:
```

### 6. Environment Configuration

```bash
# .env.backend
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/arblens
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
POLYMARKET_API_KEY=your-polymarket-key
KALSHI_API_KEY=your-kalshi-key
BETFAIR_APP_KEY=your-betfair-key
BETFAIR_USERNAME=your-username
BETFAIR_PASSWORD=your-password

# Security
JWT_SECRET_KEY=your-jwt-secret
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO
```

### 7. Deployment Configuration

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arblens-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: arblens-api
  template:
    metadata:
      labels:
        app: arblens-api
    spec:
      containers:
      - name: api
        image: arblens/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: arblens-secrets
              key: database-url
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

### 8. Monitoring and Logging

```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import logging

# Metrics
arbitrage_opportunities_found = Counter('arbitrage_opportunities_total', 'Total arbitrage opportunities found')
market_sync_duration = Histogram('market_sync_duration_seconds', 'Time spent syncing markets', ['venue'])
active_opportunities = Gauge('active_opportunities_count', 'Number of active arbitrage opportunities')

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/arblens.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

## Deployment Instructions

### 1. Local Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/arblens-backend.git
cd arblens-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start services with Docker Compose
docker-compose up -d

# Run database migrations
python -m alembic upgrade head

# Start the API server
uvicorn main:app --reload
```

### 2. Production Deployment
```bash
# Build Docker image
docker build -t arblens/api:latest .

# Deploy to Kubernetes
kubectl apply -f kubernetes/

# Or deploy to cloud provider (AWS, GCP, Azure)
# Follow cloud-specific deployment guides
```

### 3. Frontend Integration

Update your React frontend to connect to the new backend:

```javascript
// src/config/api.js
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' ?'https://api.arblens.com' :'http://localhost:8000',
  websocketURL: process.env.NODE_ENV === 'production' ?'wss://api.arblens.com/ws' :'ws://localhost:8000/ws'
};

// src/services/apiService.js
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 10000
});

export const apiService = {
  async getArbitrageOpportunities(filters) {
    const response = await apiClient.get('/api/v1/opportunities', { params: filters });
    return response.data;
  },
  
  async createBacktest(backtestData) {
    const response = await apiClient.post('/api/v1/backtests', backtestData);
    return response.data;
  }
};

// WebSocket connection for real-time updates
export const connectWebSocket = (onMessage) => {
  const ws = new WebSocket(`${API_CONFIG.websocketURL}/opportunities`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  return ws;
};
```

This architecture provides a complete production-ready backend that transforms your ArbLens React app from mock data to real-time arbitrage opportunity detection and analysis.