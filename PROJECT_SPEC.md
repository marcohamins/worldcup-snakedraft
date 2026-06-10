# World Cup Snake Draft Tracker

## Overview

Build a website to track a World Cup team snake draft pool.

The site should automatically update throughout the tournament, calculate scores for each participant, and display leaderboards and score trajectories.

The site will be hosted for free on GitHub Pages.

---

# Participants

Draft order:

1. Marco
2. Peter
3. Chris
4. Davis
5. Dylan
6. Ryan
7. Jackson
8. Will

Snake draft format:

Round 1:
1 → 8

Round 2:
8 → 1

Round 3:
1 → 8

Round 4:
8 → 1

Each participant will ultimately own 4 teams.

The teams will not be known until draft day.

Create the system so that draft selections can easily be entered later.

---

# Scoring System

## Group Stage

Win = 3 points

Draw = 1 point

Group Winner Bonus = 3 points

Example:

A team that goes 2 wins, 1 draw, and wins its group earns:

2 × 3 + 1 × 1 + 3 bonus = 10 points

---

## Knockout Stage

Round of 32 win = 6 points

Round of 16 win = 12 points

Quarterfinal win = 24 points

Semifinal win = 48 points

Final win = 96 points

Third-place game should not count unless explicitly configured later.

Store scoring rules in a configuration file so they can easily be changed.

Example:

scoring.json

{
"group_win": 3,
"group_draw": 1,
"group_winner_bonus": 3,
"round_of_32_win": 6,
"round_of_16_win": 12,
"quarterfinal_win": 24,
"semifinal_win": 48,
"final_win": 96
}

---

# Data Source

Use a free football/soccer API.

Preferred order:

1. football-data.org
2. TheSportsDB
3. API-Football

Create the code so the data source can be swapped later.

The system should automatically pull:

* Match results
* Group standings
* Knockout bracket progression

Do not require manual score entry.

---

# Architecture

Use:

* Next.js
* TypeScript
* Tailwind CSS
* Recharts

Deploy as a static site.

No backend server.

Use GitHub Actions to update tournament data on a schedule.

---

# Repository Structure

/data

draft.json

teams.json

standings.json

history.json

scoring.json

/public

/src

/components

/lib

/scripts

.github/workflows

---

# Draft Data

Create a file:

draft.json

Example structure:

{
"Argentina": "Marco",
"Brazil": "Peter",
"France": "Chris"
}

The website should read ownership from this file.

---

# Score Engine

Create reusable functions:

calculateTeamScore()

calculatePlayerScore()

calculateLeaderboard()

All calculations should derive from tournament data and scoring.json.

No hardcoded values.

---

# Automatic Updates

Create a GitHub Action.

Schedule:

Every 1 hours.

Workflow:

1. Fetch latest World Cup data.
2. Recalculate team scores.
3. Recalculate participant scores.
4. Update history.json.
5. Commit updated data files.
6. Trigger GitHub Pages rebuild.

The site should remain completely static.

---

# Leaderboard Page

Display:

Rank

Participant

Total Score

Number of Teams Remaining

Points Behind Leader

Current Best Team

Sortable table preferred.

---

# Team Ownership Page

Display all drafted teams grouped by participant.

Example:

Marco

* Argentina
* Japan
* USA
* Morocco

Peter

* Brazil
* Denmark
* Mexico
* Switzerland

etc.

---

# Team Detail Page

For each team display:

Current score

Group record

Group position

Matches played

Upcoming match

Knockout progress

Owner

---

# Historical Tracking

Store snapshots after every update.

history.json format:

[
{
"timestamp": "2026-06-15T12:00:00Z",
"Marco": 15,
"Peter": 12,
"Chris": 9
}
]

Append new snapshots automatically.

---

# Visualizations

Use Recharts.

Create:

## Score Trajectory

Line chart.

X-axis:

Time

Y-axis:

Points

One line per participant.

---

## Team Contribution Chart

For each participant:

Stacked bar chart showing how many points came from each drafted team.

---

## Current Standings Chart

Bar chart ranking participants.

---

# Bonus Features

Implement if straightforward.

## What-if Simulator

Select a future match result.

Show projected leaderboard impact.

Example:

"If Brazil wins"

Marco +12

Ryan +24

Peter +6

---

## Remaining Equity

Estimate maximum remaining possible points for each participant.

Display:

Current Points

Maximum Possible Points

Current Rank

Potential Rank

---

# Design

Keep design simple.

Dark mode support.

Mobile friendly.

Fast loading.

No authentication required.

---

# Setup Documentation

Create:

README.md

Include:

* local development instructions
* deployment instructions
* GitHub Pages setup
* API key setup
* how to enter draft selections
* how to modify scoring rules

The goal is a fully automated World Cup snake draft tracker requiring minimal maintenance after draft day.
