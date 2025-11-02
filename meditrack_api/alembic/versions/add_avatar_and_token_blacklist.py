"""Add avatar_url to users and create token_blacklist table

Revision ID: 003_auth_enhancements
Revises: 002_previous_migration
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '003_auth_enhancements'
down_revision = '002_previous_migration'  # Update this to match your latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add authentication enhancements."""
    
    # Add avatar_url column to users table
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    
    # Create token_blacklist table
    op.create_table(
        'token_blacklist',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('blacklisted_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    
    # Create indexes for performance
    op.create_index('idx_token_blacklist_token', 'token_blacklist', ['token'])
    op.create_index('idx_token_blacklist_user_id', 'token_blacklist', ['user_id'])
    op.create_index('idx_token_blacklist_expires_at', 'token_blacklist', ['expires_at'])


def downgrade() -> None:
    """Revert authentication enhancements."""
    
    # Drop indexes
    op.drop_index('idx_token_blacklist_expires_at', table_name='token_blacklist')
    op.drop_index('idx_token_blacklist_user_id', table_name='token_blacklist')
    op.drop_index('idx_token_blacklist_token', table_name='token_blacklist')
    
    # Drop token_blacklist table
    op.drop_table('token_blacklist')
    
    # Remove avatar_url column from users
    op.drop_column('users', 'avatar_url')
