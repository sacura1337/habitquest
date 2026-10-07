"""Начальная схема базы данных HabitQuest.

Создаёт шесть связанных таблиц:

* ``users`` — пользователи;
* ``categories`` — категории привычек;
* ``habits`` — привычки пользователей;
* ``habit_completions`` — история выполнения привычек;
* ``achievements`` — справочник достижений;
* ``user_achievements`` — полученные пользователями достижения.

Все внешние ключи создаются с ``ON DELETE CASCADE``.

Revision ID: 892e25561b81
Revises:
Create Date: 2026-10-07 12:53:28.201017

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '892e25561b81'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('achievements',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('code', sa.String(length=50), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('icon', sa.String(length=50), nullable=False),
    sa.Column('xp_reward', sa.Integer(), nullable=False),
    sa.Column('target', sa.Integer(), nullable=False),
    sa.Column('condition_type', sa.String(length=50), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_achievements_code'), ['code'], unique=True)

    op.create_table('categories',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('slug', sa.String(length=50), nullable=False),
    sa.Column('color', sa.String(length=9), nullable=False),
    sa.Column('icon', sa.String(length=50), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('categories', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_categories_slug'), ['slug'], unique=True)

    op.create_table('users',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('xp', sa.Integer(), server_default='0', nullable=False),
    sa.Column('level', sa.Integer(), server_default='1', nullable=False),
    sa.Column('avatar_url', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)

    op.create_table('habits',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('category_id', sa.Integer(), nullable=False),
    sa.Column('difficulty', sa.String(length=10), nullable=False),
    sa.Column('frequency', sa.String(length=10), nullable=False),
    sa.Column('reminder_time', sa.Time(), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name='ck_habits_difficulty'),
    sa.CheckConstraint("frequency IN ('daily', 'weekly', 'monthly')", name='ck_habits_frequency'),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_habits_category_id'), ['category_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_habits_user_id'), ['user_id'], unique=False)

    op.create_table('user_achievements',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('achievement_id', sa.Integer(), nullable=False),
    sa.Column('unlocked_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievements_user_achievement')
    )
    with op.batch_alter_table('user_achievements', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_achievements_achievement_id'), ['achievement_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_user_achievements_user_id'), ['user_id'], unique=False)

    op.create_table('habit_completions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('habit_id', sa.Integer(), nullable=False),
    sa.Column('completed_at', sa.DateTime(), nullable=False),
    sa.Column('completion_date', sa.Date(), nullable=False),
    sa.Column('xp_earned', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['habit_id'], ['habits.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('habit_id', 'completion_date', name='uq_habit_completions_habit_date')
    )
    with op.batch_alter_table('habit_completions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_habit_completions_completion_date'), ['completion_date'], unique=False)
        batch_op.create_index(batch_op.f('ix_habit_completions_habit_id'), ['habit_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('habit_completions', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_habit_completions_habit_id'))
        batch_op.drop_index(batch_op.f('ix_habit_completions_completion_date'))

    op.drop_table('habit_completions')
    with op.batch_alter_table('user_achievements', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_achievements_user_id'))
        batch_op.drop_index(batch_op.f('ix_user_achievements_achievement_id'))

    op.drop_table('user_achievements')
    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_habits_user_id'))
        batch_op.drop_index(batch_op.f('ix_habits_category_id'))

    op.drop_table('habits')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_email'))

    op.drop_table('users')
    with op.batch_alter_table('categories', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_categories_slug'))

    op.drop_table('categories')
    with op.batch_alter_table('achievements', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_achievements_code'))

    op.drop_table('achievements')
