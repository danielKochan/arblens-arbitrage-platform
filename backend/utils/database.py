import asyncpg
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

class DatabaseManager:
    """Database utilities for ArbLens backend"""
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
        self.pool: Optional[asyncpg.Pool] = None
    
    async def create_pool(self):
        """Create connection pool"""
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self.pool = await asyncpg.create_pool(
            self.database_url,
            min_size=1,
            max_size=10,
            command_timeout=60
        )
        return self.pool
    
    async def close_pool(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def get_connection(self):
        """Get database connection from pool"""
        if not self.pool:
            await self.create_pool()
        return await self.pool.acquire()
    
    async def release_connection(self, conn):
        """Release connection back to pool"""
        if self.pool:
            await self.pool.release(conn)
    
    async def execute_query(self, query: str, *args) -> List[Dict[str, Any]]:
        """Execute query and return results as list of dicts"""
        conn = await self.get_connection()
        try:
            rows = await conn.fetch(query, *args)
            result = []
            for row in rows:
                row_dict = dict(row)
                # Convert types for JSON serialization
                for key, value in row_dict.items():
                    if hasattr(value, '__float__'):
                        row_dict[key] = float(value)
                    elif isinstance(value, datetime):
                        row_dict[key] = value.isoformat()
                result.append(row_dict)
            return result
        finally:
            await self.release_connection(conn)
    
    async def execute_query_single(self, query: str, *args) -> Optional[Dict[str, Any]]:
        """Execute query and return single result as dict"""
        conn = await self.get_connection()
        try:
            row = await conn.fetchrow(query, *args)
            if not row:
                return None
            
            row_dict = dict(row)
            # Convert types for JSON serialization
            for key, value in row_dict.items():
                if hasattr(value, '__float__'):
                    row_dict[key] = float(value)
                elif isinstance(value, datetime):
                    row_dict[key] = value.isoformat()
            return row_dict
        finally:
            await self.release_connection(conn)
    
    async def execute_command(self, query: str, *args) -> str:
        """Execute command and return status"""
        conn = await self.get_connection()
        try:
            result = await conn.execute(query, *args)
            return result
        finally:
            await self.release_connection(conn)
    
    async def health_check(self) -> bool:
        """Check database connection health"""
        try:
            conn = await self.get_connection()
            await conn.execute("SELECT 1")
            await self.release_connection(conn)
            return True
        except Exception:
            return False

# Global database manager instance
db_manager = DatabaseManager()