from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import asyncpg
import json

# Initialize FastAPI app
app = FastAPI(
    title="ArbLens API",
    version="1.0.0", 
    description="AI-powered arbitrage detection platform API"
)

# Enhanced CORS middleware for production deployment
origins = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://*.vercel.app",
    "https://*.netlify.app",
    "https://*.onrender.com",
    "https://arblens.onrender.com",
    "https://arblens-frontend.onrender.com"
]

# Add environment-specific origins
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))
if os.getenv("FRONTEND_DOMAIN"):
    origins.append(os.getenv("FRONTEND_DOMAIN"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "*",
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "X-Requested-With"
    ],
    expose_headers=["*"],
    max_age=86400,  # 24 hours
)

# Add explicit OPTIONS handler for problematic routes
@app.options("/api/v1/opportunities")
@app.options("/api/v1/venues")
@app.options("/api/v1/markets")
@app.options("/api/v1/stats")
@app.options("/api/v1/backtests")
async def handle_options():
    """Handle OPTIONS preflight requests"""
    return JSONResponse(
        status_code=200,
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        }
    )

# Enhanced database connection with better error logging
DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

async def get_db_connection():
    """Get database connection with enhanced error handling"""
    if not DATABASE_URL:
        print("❌ No database URL found. Checking environment variables...")
        print(f"SUPABASE_DB_URL: {os.getenv('SUPABASE_DB_URL', 'NOT SET')}")
        print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')}")
        raise HTTPException(
            status_code=500, 
            detail="Database configuration missing. Please set SUPABASE_DB_URL environment variable."
        )
    
    try:
        print(f"🔗 Attempting database connection...")
        # Add connection timeout and better error handling
        connection = await asyncpg.connect(
            DATABASE_URL,
            timeout=30.0,  # Increased timeout
            server_settings={
                'application_name': 'arblens_api'
            }
        )
        
        # Test the connection
        test_result = await connection.fetchval("SELECT 1")
        print(f"✅ Database connection successful. Test query result: {test_result}")
        return connection
        
    except asyncpg.InvalidAuthorizationSpecificationError as e:
        print(f"❌ Database authentication failed: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database authentication failed. Check your Supabase connection string and credentials: {str(e)}"
        )
    except asyncpg.InvalidCatalogNameError as e:
        print(f"❌ Database not found: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database not found. Check your Supabase project URL and database name: {str(e)}"
        )
    except asyncpg.PostgresConnectionError as e:
        print(f"❌ PostgreSQL connection error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Cannot connect to Supabase database. Check network connectivity and Supabase status: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Unexpected database error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database connection failed: {str(e)}"
        )

# Enhanced health check endpoint
@app.get("/health")
async def health_check():
    """Enhanced health check endpoint for deployment monitoring"""
    try:
        conn = await get_db_connection()
        
        # Test database query
        result = await conn.fetchval("SELECT COUNT(*) FROM arbitrage_opportunities WHERE status = 'active'")
        await conn.close()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "active_opportunities": result or 0,
            "environment": os.getenv("ENVIRONMENT", "development"),
            "cors_origins": len(origins)
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "error": str(e), 
                "timestamp": datetime.utcnow().isoformat(),
                "database": "disconnected",
                "environment": os.getenv("ENVIRONMENT", "development")
            }
        )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ArbLens API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "database_configured": bool(DATABASE_URL),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "cors_enabled": True
    }

# Enhanced Arbitrage Opportunities Endpoints with better parameter validation
@app.get("/api/v1/opportunities")
async def get_arbitrage_opportunities(
    request: Request,
    min_spread: Optional[float] = Query(None, description="Minimum spread percentage", ge=0),
    min_liquidity: Optional[float] = Query(None, description="Minimum liquidity in USD", ge=0),
    venues: Optional[str] = Query(None, description="Comma-separated venue names"),
    category: Optional[str] = Query(None, description="Market category filter"),
    limit: Optional[int] = Query(50, description="Maximum number of results", ge=1, le=1000),
    status: Optional[str] = Query("active", description="Opportunity status")
):
    """Get current arbitrage opportunities with filtering and enhanced error handling"""
    try:
        conn = await get_db_connection()
        
        # Build query with proper error handling
        try:
            query = """
            SELECT ao.*, 
                   mp.confidence_score,
                   ma.title as market_a_title, ma.category as market_a_category,
                   mb.title as market_b_title, mb.category as market_b_category,
                   va.name as venue_a_name, va.venue_type as venue_a_type,
                   vb.name as venue_b_name, vb.venue_type as venue_b_type
            FROM arbitrage_opportunities ao
            JOIN market_pairs mp ON ao.pair_id = mp.id
            JOIN markets ma ON mp.market_a_id = ma.id
            JOIN markets mb ON mp.market_b_id = mb.id  
            JOIN venues va ON ma.venue_id = va.id
            JOIN venues vb ON mb.venue_id = vb.id
            WHERE ao.status = $1
            """
            
            params = [status]
            param_count = 1
            
            if min_spread is not None:
                param_count += 1
                query += f" AND ao.net_spread_pct >= ${param_count}"
                params.append(min_spread)
                
            if min_liquidity is not None:
                param_count += 1
                query += f" AND ao.max_tradable_amount >= ${param_count}"
                params.append(min_liquidity)
                
            if category:
                param_count += 1
                query += f" AND (ma.category = ${param_count} OR mb.category = ${param_count})"
                params.append(category)
                
            if venues:
                venue_list = [v.strip() for v in venues.split(',')]
                param_count += 1
                query += f" AND (va.name = ANY(${param_count}) OR vb.name = ANY(${param_count}))"
                params.append(venue_list)
            
            query += f" ORDER BY ao.net_spread_pct DESC LIMIT ${param_count + 1}"
            params.append(limit)
            
            rows = await conn.fetch(query, *params)
            
        except asyncpg.PostgresError as e:
            await conn.close()
            raise HTTPException(
                status_code=500, 
                detail=f"Database query failed: {str(e)}"
            )
        
        await conn.close()
        
        # Convert to list of dicts
        opportunities = []
        for row in rows:
            opp = dict(row)
            # Convert decimal to float for JSON serialization
            for key, value in opp.items():
                if hasattr(value, '__float__'):
                    opp[key] = float(value)
                elif isinstance(value, datetime):
                    opp[key] = value.isoformat()
                    
            opportunities.append(opp)
        
        return {
            "opportunities": opportunities,
            "total": len(opportunities),
            "filters": {
                "min_spread": min_spread,
                "min_liquidity": min_liquidity,
                "venues": venues,
                "category": category,
                "status": status,
                "limit": limit
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error retrieving opportunities: {str(e)}"
        )

# Enhanced Venue Endpoints with better validation
@app.get("/api/v1/venues")
async def get_venues(
    request: Request,
    status: Optional[str] = Query("active", description="Venue status filter"),
    venue_type: Optional[str] = Query(None, description="Venue type filter")
):
    """Get list of trading venues"""
    try:
        conn = await get_db_connection()
        
        query = "SELECT * FROM venues WHERE 1=1"
        params = []
        param_count = 0
        
        if status:
            param_count += 1
            query += f" AND status = ${param_count}"
            params.append(status)
            
        if venue_type:
            param_count += 1
            query += f" AND venue_type = ${param_count}"
            params.append(venue_type)
            
        query += " ORDER BY name"
        
        rows = await conn.fetch(query, *params)
        await conn.close()
        
        venues = []
        for row in rows:
            venue = dict(row)
            for key, value in venue.items():
                if hasattr(value, '__float__'):
                    venue[key] = float(value)
                elif isinstance(value, datetime):
                    venue[key] = value.isoformat()
            venues.append(venue)
        
        return {
            "venues": venues, 
            "total": len(venues),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch venues: {str(e)}")

# Enhanced Market Endpoints
@app.get("/api/v1/markets")
async def get_markets(
    request: Request,
    venue_id: Optional[str] = Query(None, description="Filter by venue ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query("active", description="Market status filter"),
    limit: Optional[int] = Query(100, description="Maximum number of results", ge=1, le=1000)
):
    """Get list of markets"""
    try:
        conn = await get_db_connection()
        
        query = """
        SELECT m.*, v.name as venue_name, v.venue_type 
        FROM markets m
        JOIN venues v ON m.venue_id = v.id
        WHERE 1=1
        """
        params = []
        param_count = 0
        
        if status:
            param_count += 1
            query += f" AND m.status = ${param_count}"
            params.append(status)
            
        if venue_id:
            param_count += 1
            query += f" AND m.venue_id = ${param_count}"
            params.append(venue_id)
            
        if category:
            param_count += 1
            query += f" AND m.category = ${param_count}"
            params.append(category)
            
        query += f" ORDER BY m.last_updated DESC LIMIT ${param_count + 1}"
        params.append(limit)
        
        rows = await conn.fetch(query, *params)
        await conn.close()
        
        markets = []
        for row in rows:
            market = dict(row)
            for key, value in market.items():
                if hasattr(value, '__float__'):
                    market[key] = float(value)
                elif isinstance(value, datetime):
                    market[key] = value.isoformat()
            markets.append(market)
        
        return {
            "markets": markets, 
            "total": len(markets),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch markets: {str(e)}")

# Platform Statistics with fallback
@app.get("/api/v1/stats")
async def get_platform_stats(request: Request):
    """Get platform-wide statistics"""
    try:
        conn = await get_db_connection()
        
        # Get various stats
        stats_queries = {
            'active_opportunities': "SELECT COUNT(*) FROM arbitrage_opportunities WHERE status = 'active'",
            'total_venues': "SELECT COUNT(*) FROM venues WHERE status = 'active'",
            'total_markets': "SELECT COUNT(*) FROM markets WHERE status = 'active'",
            'avg_spread': "SELECT AVG(net_spread_pct) FROM arbitrage_opportunities WHERE status = 'active'",
            'total_volume': "SELECT SUM(max_tradable_amount) FROM arbitrage_opportunities WHERE status = 'active'"
        }
        
        stats = {}
        for key, query in stats_queries.items():
            result = await conn.fetchval(query)
            if result is not None:
                if hasattr(result, '__float__'):
                    stats[key] = round(float(result), 2)
                else:
                    stats[key] = result
            else:
                stats[key] = 0
        
        await conn.close()
        
        return {
            "stats": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")

# Enhanced Backtest Endpoints  
@app.post("/api/v1/backtests")
async def create_backtest(
    request: Request,
    backtest_data: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Create and queue a new backtest"""
    try:
        # Validate required fields
        required_fields = ['name', 'start_date', 'end_date', 'user_id']
        for field in required_fields:
            if field not in backtest_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        conn = await get_db_connection()
        
        # Insert backtest record
        query = """
        INSERT INTO backtests (
            user_id, name, start_date, end_date, min_spread_pct, 
            min_liquidity_usd, venue_filter, total_opportunities,
            profitable_opportunities, total_profit_pct, total_profit_usd,
            max_drawdown_pct, sharpe_ratio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, created_at
        """
        
        row = await conn.fetchrow(
            query,
            backtest_data['user_id'],
            backtest_data['name'],
            backtest_data['start_date'],
            backtest_data['end_date'],
            backtest_data.get('min_spread_pct', 1.0),
            backtest_data.get('min_liquidity_usd', 500.0),
            backtest_data.get('venue_filter', []),
            0,  # Will be calculated
            0,  # Will be calculated  
            0.0,  # Will be calculated
            0.0,  # Will be calculated
            0.0,  # Will be calculated
            0.0   # Will be calculated
        )
        
        await conn.close()
        
        backtest_id = row['id']
        
        # Queue background task to calculate backtest results
        background_tasks.add_task(calculate_backtest_results, backtest_id, backtest_data)
        
        return {
            "id": backtest_id,
            "status": "queued",
            "message": "Backtest created and queued for processing",
            "created_at": row['created_at'].isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backtest: {str(e)}")

@app.get("/api/v1/backtests/{backtest_id}")
async def get_backtest_results(request: Request, backtest_id: str):
    """Get backtest results"""
    try:
        conn = await get_db_connection()
        
        query = "SELECT * FROM backtests WHERE id = $1"
        row = await conn.fetchrow(query, backtest_id)
        await conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Backtest not found")
        
        backtest = dict(row)
        for key, value in backtest.items():
            if hasattr(value, '__float__'):
                backtest[key] = float(value)
            elif isinstance(value, datetime):
                backtest[key] = value.isoformat()
            elif isinstance(value, date):
                backtest[key] = value.isoformat()
        
        return backtest
        
    except Exception as e:
        if "not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to fetch backtest: {str(e)}")

# Background task for backtest calculation
async def calculate_backtest_results(backtest_id: str, backtest_data: Dict[str, Any]):
    """Calculate backtest results in background"""
    try:
        conn = await get_db_connection()
        
        # Get historical opportunities for the backtest period
        query = """
        SELECT ao.net_spread_pct, ao.expected_profit_usd, ao.max_tradable_amount,
               ao.created_at
        FROM arbitrage_opportunities ao
        JOIN market_pairs mp ON ao.pair_id = mp.id
        JOIN markets ma ON mp.market_a_id = ma.id
        JOIN markets mb ON mp.market_b_id = mb.id
        WHERE ao.created_at >= $1 AND ao.created_at <= $2
        AND ao.net_spread_pct >= $3
        AND ao.max_tradable_amount >= $4
        ORDER BY ao.created_at
        """
        
        rows = await conn.fetch(
            query,
            backtest_data['start_date'],
            backtest_data['end_date'] + ' 23:59:59',
            backtest_data.get('min_spread_pct', 1.0),
            backtest_data.get('min_liquidity_usd', 500.0)
        )
        
        if not rows:
            # Update with zero results
            await conn.execute(
                "UPDATE backtests SET total_opportunities = 0 WHERE id = $1",
                backtest_id
            )
            await conn.close()
            return
        
        # Calculate metrics
        total_opportunities = len(rows)
        profitable_opportunities = len([r for r in rows if float(r['net_spread_pct']) > 0])
        
        total_profit_pct = sum(float(r['net_spread_pct']) for r in rows) / 100
        total_profit_usd = sum(float(r['expected_profit_usd'] or 0) for r in rows)
        
        # Simplified Sharpe ratio calculation
        daily_returns = {}
        for row in rows:
            date_key = row['created_at'].date()
            if date_key not in daily_returns:
                daily_returns[date_key] = []
            daily_returns[date_key].append(float(row['net_spread_pct']) / 100)
        
        daily_avg_returns = [sum(returns) / len(returns) for returns in daily_returns.values()]
        
        if len(daily_avg_returns) > 1:
            avg_return = sum(daily_avg_returns) / len(daily_avg_returns)
            variance = sum((r - avg_return) ** 2 for r in daily_avg_returns) / len(daily_avg_returns)
            volatility = variance ** 0.5
            sharpe_ratio = avg_return / volatility if volatility > 0 else 0
        else:
            sharpe_ratio = 0
        
        # Simple max drawdown calculation
        cumulative_returns = []
        cumulative = 0
        for returns in daily_avg_returns:
            cumulative += returns
            cumulative_returns.append(cumulative)
        
        max_drawdown = 0
        peak = 0
        for ret in cumulative_returns:
            if ret > peak:
                peak = ret
            drawdown = peak - ret
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        # Update backtest with calculated results
        update_query = """
        UPDATE backtests 
        SET total_opportunities = $1,
            profitable_opportunities = $2,
            total_profit_pct = $3,
            total_profit_usd = $4,
            max_drawdown_pct = $5,
            sharpe_ratio = $6
        WHERE id = $7
        """
        
        await conn.execute(
            update_query,
            total_opportunities,
            profitable_opportunities,
            round(total_profit_pct, 4),
            round(total_profit_usd, 2),
            round(max_drawdown * 100, 4),
            round(sharpe_ratio, 2),
            backtest_id
        )
        
        await conn.close()
        
    except Exception as e:
        print(f"Error calculating backtest {backtest_id}: {e}")
        # Update backtest with error status could be added here

# Enhanced error handlers with CORS support
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint not found", 
            "path": str(request.url.path),
            "method": request.method,
            "available_endpoints": [
                "/health",
                "/api/v1/opportunities",
                "/api/v1/venues",
                "/api/v1/markets",
                "/api/v1/stats"
            ]
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error", 
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url.path),
            "method": request.method
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Add startup event to test database connection
@app.on_event("startup")
async def startup_event():
    """Test database connection on startup"""
    try:
        if DATABASE_URL:
            conn = await get_db_connection()
            await conn.close()
            print("✅ Database connection successful")
            print(f"✅ CORS configured for {len(origins)} origins")
        else:
            print("⚠️  No database URL configured")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

# Add middleware to log requests for debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for debugging CORS issues"""
    print(f"📥 {request.method} {request.url.path} from {request.headers.get('origin', 'unknown')}")
    
    if request.method == "OPTIONS": print(f"🔄 CORS preflight request detected")
        
    response = await call_next(request)
    
    print(f"📤 Response: {response.status_code}")
    return response

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)