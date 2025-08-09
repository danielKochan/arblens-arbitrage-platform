from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

class VenueType(str, Enum):
    PREDICTION_MARKET = "prediction_market"
    SPORTS_BETTING = "sports_betting"
    CRYPTO_EXCHANGE = "crypto_exchange"

class VenueStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"
    MAINTENANCE = "maintenance"

class MarketStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    SETTLED = "settled"
    CANCELLED = "cancelled"

class OpportunityStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    INSUFFICIENT_LIQUIDITY = "insufficient_liquidity"
    EXECUTED = "executed"

class UserRole(str, Enum):
    ADMIN = "admin"
    PRO_USER = "pro_user"
    BASIC_USER = "basic_user"

class ApiKeyTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    PARTNER = "partner"

# Request/Response Models

class OpportunityFilter(BaseModel):
    min_spread: Optional[float] = Field(None, description="Minimum spread percentage")
    min_liquidity: Optional[float] = Field(None, description="Minimum liquidity in USD")
    venues: Optional[str] = Field(None, description="Comma-separated venue names")
    category: Optional[str] = Field(None, description="Market category filter")
    status: Optional[OpportunityStatus] = Field(OpportunityStatus.ACTIVE, description="Opportunity status")
    limit: Optional[int] = Field(50, description="Maximum results", ge=1, le=1000)

class OpportunityResponse(BaseModel):
    id: str
    pair_id: str
    gross_spread_pct: float
    net_spread_pct: float
    expected_profit_pct: float
    expected_profit_usd: Optional[float]
    max_tradable_amount: Optional[float]
    venue_a_side: str
    venue_b_side: str
    venue_a_price: float
    venue_b_price: float
    venue_a_liquidity: Optional[float]
    venue_b_liquidity: Optional[float]
    risk_level: Optional[str]
    status: OpportunityStatus
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    # Related data
    confidence_score: Optional[int]
    market_a_title: Optional[str]
    market_b_title: Optional[str]
    venue_a_name: Optional[str]
    venue_b_name: Optional[str]

class VenueResponse(BaseModel):
    id: str
    name: str
    venue_type: VenueType
    api_url: Optional[str]
    websocket_url: Optional[str]
    fee_bps: Optional[int]
    min_trade_size: Optional[float]
    max_trade_size: Optional[float]
    supports_websocket: Optional[bool]
    requires_auth: Optional[bool]
    geo_restrictions: Optional[List[str]]
    status: VenueStatus
    last_sync_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class MarketResponse(BaseModel):
    id: str
    venue_id: str
    external_id: str
    title: str
    description: Optional[str]
    category: Optional[str]
    event_date: Optional[datetime]
    resolution_date: Optional[datetime]
    yes_price: Optional[float]
    no_price: Optional[float]
    yes_liquidity: Optional[float]
    no_liquidity: Optional[float]
    volume_24h: Optional[float]
    tick_size: Optional[float]
    market_url: Optional[str]
    status: MarketStatus
    last_updated: datetime
    created_at: datetime
    
    # Venue info
    venue_name: Optional[str]
    venue_type: Optional[VenueType]

class BacktestRequest(BaseModel):
    name: str = Field(..., description="Backtest name")
    start_date: date = Field(..., description="Start date for backtest")
    end_date: date = Field(..., description="End date for backtest")
    user_id: str = Field(..., description="User ID running the backtest")
    min_spread_pct: Optional[float] = Field(1.0, description="Minimum spread percentage", ge=0)
    min_liquidity_usd: Optional[float] = Field(500.0, description="Minimum liquidity in USD", ge=0)
    venue_filter: Optional[List[str]] = Field([], description="Filter by venue names")
    
    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v
    
    @validator('start_date', 'end_date')
    def dates_not_future(cls, v):
        if v > date.today():
            raise ValueError('Dates cannot be in the future')
        return v

class BacktestResponse(BaseModel):
    id: str
    user_id: str
    name: str
    start_date: date
    end_date: date
    min_spread_pct: float
    min_liquidity_usd: float
    venue_filter: List[str]
    total_opportunities: int
    profitable_opportunities: int
    total_profit_pct: float
    total_profit_usd: float
    max_drawdown_pct: float
    sharpe_ratio: float
    created_at: datetime

class PlatformStats(BaseModel):
    active_opportunities: int
    total_venues: int
    total_markets: int
    avg_spread: float
    total_volume: float
    timestamp: datetime

class HealthStatus(BaseModel):
    status: str
    timestamp: datetime
    database_connected: Optional[bool]
    error: Optional[str]

class ErrorResponse(BaseModel):
    detail: str
    timestamp: Optional[datetime]
    path: Optional[str]

# API Response wrappers
class OpportunitiesListResponse(BaseModel):
    opportunities: List[OpportunityResponse]
    total: int
    filters: OpportunityFilter

class VenuesListResponse(BaseModel):
    venues: List[VenueResponse]
    total: int

class MarketsListResponse(BaseModel):
    markets: List[MarketResponse]
    total: int

class BacktestCreateResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: datetime

class StatsResponse(BaseModel):
    stats: PlatformStats
    timestamp: datetime