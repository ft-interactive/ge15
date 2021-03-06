# Schema plan

### Proposed data schema

## Constituency
+ ons_id* (ONS)
+ ft_name (allows us to change the style of name)
+ ons_name (never changes)
+ region_code (ONS - FK region.id) 
+ region_name (ONS)
+ ft_slug* (from name field)
+ pa_id*
+ bbc_id*
+ bbc_href*
+ guardian_id*
+ guardian_href*
+ party_previous
+ ? has_result - used for election night
+ party
+ swing
+ swing_from
+ swing_to
+ is_gain (boolean)
+ declaration_time
+ revision

# ConstituencyGroup
+ id
+ name
+ description
+ is_dynamic (constituencies appear in here if they satify a query - no membership in ConstiuencyGroupMembers)
+ query
+ weight (used for sorting lists of groups)

# ConstiuencyGroupMembers
+ group_id (FK ConstituencyGroup.id)
+ constituency_id (FK constituency.id)

## Region
+ id* (ONS)
+ name (ONS)
+ slug* (derived from name field)

## Ward
+ id* (ONS)
+ name (ONS)
+ slug (generated by speakingurl)
+ constituency_id (FK constituency.id)
+ constituency_slug (FK constituency.slug)

## Party
+ abbrv* (from PA, not necessarily very readable eg "C" for conservative)
+ name (the full proper name, eg Liberal Democrats)
+ shortname (eg Lib Dems)
+ ftabbrv (max 5 chars, case sensitive: eg Con --  for use in space constrained labeling)
+ slug (derived from shortname field)
+ color
+ secondary_color

## Election
+ id (built from ons_id and election date nuix timestamp)
+ date
+ constituency_id (FK constitiuency.id)
+ is_byelection (boolean)
+ is_notional (boolean)
+ electorate
+ turnout
+ turnout_pc (% turnout)
+ turnout_pc_change
+ winning_votes
+ winning_candidate_name
+ winning_candidate_id (FK candidate.id - or null if not running in 2015)
+ winning_party (FK party.abbreviation)
+ majority (integer)
+ majority_pc
+ majority_pc_change
+ is_gain (boolean)
+ sitting_party (FK party.abbreviation)
+ swing (integer)
+ swing_to (FK party.id)
+ swing_from (FK party.id)

## Candidate

+ id* (numeric)
+ date
+ election_id
+ party (FK party.abbreviation)
+ votes
+ votes_pc
+ candidate_name
+ sex
+ slug (made by concatenating party_name + name)	
+ ### Proposed data schema

## Constituency
+ ons_id* (ONS)
+ ft_name (allows us to change the style of name)
+ ons_name (never changes)
+ region_code (ONS - FK region.id) 
+ region_name (ONS)
+ ft_slug* (from name field)
+ pa_id*
+ bbc_id*
+ bbc_href*
+ guardian_id*
+ guardian_href*
+ party_previous
+ ? has_result - used for election night
+ party
+ swing
+ swing_from
+ swing_to
+ is_gain (boolean)
+ declaration_time
+ revision

# ConstituencyGroup
+ id
+ name
+ description
+ is_dynamic (constituencies appear in here if they satify a query - no membership in ConstiuencyGroupMembers)
+ query
+ weight (used for sorting lists of groups)

# ConstiuencyGroupMembers
+ group_id (FK ConstituencyGroup.id)
+ constituency_id (FK constituency.id)

## Region
+ id* (ONS)
+ name (ONS)
+ slug* (derived from name field)

## Ward
+ id* (ONS)
+ name (ONS)
+ slug (generated by speakingurl)
+ constituency_id (FK constituency.id)
+ constituency_slug (FK constituency.slug)

## Party
+ abbrv* (from PA, not necessarily very readable eg "C" for conservative)
+ name (the full proper name, eg Liberal Democrats)
+ shortname (eg Lib Dems)
+ ftabbrv (max 5 chars, case sensitive: eg Con --  for use in space constrained labeling)
+ slug (derived from shortname field)
+ color
+ secondary_color

## Election
+ id (built from ons_id and election date nuix timestamp)
+ date
+ constituency_id (FK constitiuency.id)
+ is_byelection (boolean)
+ is_notional (boolean)
+ electorate
+ turnout
+ turnout_pc (% turnout)
+ turnout_pc_change
+ winning_votes
+ winning_candidate_name
+ winning_candidate_id (FK candidate.id - or null if not running in 2015)
+ winning_party (FK party.abbreviation)
+ majority (integer)
+ majority_pc
+ majority_pc_change
+ is_gain (boolean)
+ sitting_party (FK party.abbreviation)
+ swing (integer)
+ swing_to (FK party.id)
+ swing_from (FK party.id)

## Candidate

+ id* (numeric)
+ date
+ election_id
+ party (FK party.abbreviation)
+ votes
+ votes_pc
+ candidate_name
+ sex
+ slug (made by concatenating party_name + name)
+ rush_text