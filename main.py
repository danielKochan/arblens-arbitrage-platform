from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
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

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "https://*.vercel.app",
        "https://*.netlify.app",
        "https://*.onrender.com",
        os.getenv("FRONTEND_URL", "")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")

async def get_db_connection():
    """Get database connection"""
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database URL not configured")
    
    try:
        return await asyncpg.connect(DATABASE_URL)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    try:
        if DATABASE_URL:
            conn = await get_db_connection()
            await conn.execute("SELECT 1")
            await conn.close()
            db_status = "connected"
        else:
            db_status = "not_configured"
        
        return {
            "status": "healthy", 
            "timestamp": datetime.utcnow().isoformat(),
            "database": db_status,
            "version": "1.0.0"
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "error": str(e), 
                "timestamp": datetime.utcnow().isoformat()
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
        "endpoints": {
            "opportunities": "/api/v1/opportunities",
            "venues": "/api/v1/venues", 
            "markets": "/api/v1/markets",
            "backtests": "/api/v1/backtests",
            "stats": "/api/v1/stats"
        }
    }

# Arbitrage Opportunities Endpoints
@app.get("/api/v1/opportunities")
async def get_arbitrage_opportunities(
    min_spread: Optional[float] = Query(None, description="Minimum spread percentage"),
    min_liquidity: Optional[float] = Query(None, description="Minimum liquidity in USD"),
    venues: Optional[str] = Query(None, description="Comma-separated venue names"),
    category: Optional[str] = Query(None, description="Market category filter"),
    limit: Optional[int] = Query(50, description="Maximum number of results"),
    status: Optional[str] = Query("active", description="Opportunity status")
):
    """Get current arbitrage opportunities with filtering"""
    try:
        conn = await get_db_connection()
        
        # Build query
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
                "status": status
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch opportunities: {str(e)}")

@app.get("/api/v1/opportunities/{opportunity_id}")
async def get_opportunity_detail(opportunity_id: str):
    """Get detailed information for a specific arbitrage opportunity"""
    try:
        conn = await get_db_connection()
        
        query = """
        SELECT ao.*, 
               mp.confidence_score, mp.is_manual_override,
               ma.*, va.name as venue_a_name, va.venue_type as venue_a_type, va.fee_bps as venue_a_fee,
               mb.*, vb.name as venue_b_name, vb.venue_type as venue_b_type, vb.fee_bps as venue_b_fee
        FROM arbitrage_opportunities ao
        JOIN market_pairs mp ON ao.pair_id = mp.id
        JOIN markets ma ON mp.market_a_id = ma.id
        JOIN markets mb ON mp.market_b_id = mb.id
        JOIN venues va ON ma.venue_id = va.id
        JOIN venues vb ON mb.venue_id = vb.id
        WHERE ao.id = $1
        """
        
        row = await conn.fetchrow(query, opportunity_id)
        await conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        # Convert to dict and handle data types
        opportunity = dict(row)
        for key, value in opportunity.items():
            if hasattr(value, '__float__'):
                opportunity[key] = float(value)
            elif isinstance(value, datetime):
                opportunity[key] = value.isoformat()
        
        return opportunity
        
    except Exception as e:
        if "not found" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to fetch opportunity: {str(e)}")

# Venue Endpoints
@app.get("/api/v1/venues")
async def get_venues(
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
        
        return {"venues": venues, "total": len(venues)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch venues: {str(e)}")

# Market Endpoints
@app.get("/api/v1/markets")
async def get_markets(
    venue_id: Optional[str] = Query(None, description="Filter by venue ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query("active", description="Market status filter"),
    limit: Optional[int] = Query(100, description="Maximum number of results")
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
        
        return {"markets": markets, "total": len(markets)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch markets: {str(e)}")

# Backtest Endpoints  
@app.post("/api/v1/backtests")
async def create_backtest(
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
async def get_backtest_results(backtest_id: str):
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

# Statistics endpoint
@app.get("/api/v1/stats")
async def get_platform_stats():
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

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found", "path": str(request.url)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "timestamp": datetime.utcnow().isoformat()}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))