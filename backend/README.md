# ArbLens FastAPI Backend

This is the FastAPI backend for the ArbLens arbitrage detection platform.

## Features

- FastAPI-based REST API
- Integration with existing Supabase database schema
- Real-time arbitrage opportunity detection
- Backtest calculation engine
- Market data aggregation
- User authentication integration
- Health monitoring endpoints

## Quick Start

### Local Development

1. **Clone and setup**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run the server**:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Render Deployment

1. **Create Render Web Service**:
   - Repository: Your GitHub repository
   - Build Command: `pip install -r requirements.txt`  
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3.11

2. **Set Environment Variables in Render**:
```bash
DATABASE_URL=your-supabase-connection-string
FRONTEND_URL=https://your-frontend-domain.com
ENVIRONMENT=production
```

3. **Deploy**: Render will automatically deploy when you push to your repository.

## API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

### Arbitrage Operations  
- `GET /api/v1/opportunities` - Get arbitrage opportunities with filtering
- `GET /api/v1/opportunities/{id}` - Get specific opportunity details

### Market Data
- `GET /api/v1/venues` - Get trading venues
- `GET /api/v1/markets` - Get market data with filters

### Backtesting
- `POST /api/v1/backtests` - Create new backtest
- `GET /api/v1/backtests/{id}` - Get backtest results

### Statistics
- `GET /api/v1/stats` - Get platform statistics

## Database Schema

The backend works with your existing Supabase schema including:
- `arbitrage_opportunities`
- `market_pairs`  
- `markets`
- `venues`
- `backtests`
- `user_profiles`

## Frontend Integration

Update your React app's API configuration:

```javascript
// src/config/api.js
export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-render-app.onrender.com'
    : 'http://localhost:8000'
};
```

## Monitoring

- Health check endpoint: `/health`
- API documentation: `/docs`
- Metrics and logs available through Render dashboard

## Troubleshooting

1. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Check Supabase connection pooling settings
   - Ensure database is accessible from external connections

2. **CORS Issues**:
   - Update `FRONTEND_URL` environment variable
   - Check CORS middleware configuration in `main.py`

3. **Deployment Failures**:
   - Check build logs in Render dashboard
   - Verify all environment variables are set
   - Ensure `requirements.txt` is up to date

## Development

- **Code formatting**: `black .`
- **Testing**: `pytest`
- **Local database**: Use Supabase directly or local PostgreSQL

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `FRONTEND_URL` - Your React app domain

Optional:
- `PORT` - Server port (default: 8000)
- `ENVIRONMENT` - Deployment environment
- `DEBUG` - Debug mode (default: false)
- `LOG_LEVEL` - Logging level (default: INFO)

## Support

For deployment issues:
1. Check Render build and runtime logs
2. Verify environment variables
3. Test health endpoint: `/health`
4. Check database connectivity