import { supabase } from './supabase';
import type {
  Person, Family, Profile, Contribution, Event, Media,
  CreatePersonInput, UpdatePersonInput, CreateMediaInput, ContributionStatus, EventType,
  PersonRelations,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// Security: Contact field definitions
// These fields are personal data under PDPA / Vietnamese data protection law.
// They are protected by:
//   1. RLS policies (DB-level, enforced for all API calls incl. direct REST)
//   2. Middleware auth guard (route-level, blocks unauthenticated page access)
// Only authenticated users with privacy_level < 2 access should see these.
// NEVER expose these in public/unauthenticated queries.
// ═══════════════════════════════════════════════════════════════════════════
export const CONTACT_FIELDS = ['phone', 'email', 'zalo', 'facebook', 'address'] as const;

// ═══════════════════════════════════════════════════════════════════════════
// People CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function getPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('generation', { ascending: true })
    .order('display_name', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function getPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getPersonByHandle(handle: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('handle', handle)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  // Convert empty strings to null so PostgreSQL typed columns (DATE, URL) don't reject them
  const sanitized = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v === '' ? null : v])
  ) as CreatePersonInput;

  const { data, error } = await supabase
    .from('people')
    .insert(sanitized)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePerson(id: string, input: UpdatePersonInput): Promise<Person> {
  // Convert empty strings to null so PostgreSQL typed columns (DATE, URL) don't reject them
  const sanitized = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v === '' ? null : v])
  ) as UpdatePersonInput;

  const { data, error } = await supabase
    .from('people')
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function searchPeople(query: string): Promise<Person[]> {
  // Escape LIKE special characters to prevent pattern injection
  const escaped = query.replace(/[%_\\]/g, '\\$&');
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .ilike('display_name', `%${escaped}%`)
    .order('display_name', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function getPeopleByGeneration(generation: number): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('generation', generation)
    .order('display_name', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// Families CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function getFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function getFamily(id: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getFamilyChildren(familyId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('children')
    .select('person_id, sort_order')
    .eq('family_id', familyId)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  if (!data || data.length === 0) return [];
  
  const personIds = data.map(c => c.person_id);
  const { data: people, error: peopleError } = await supabase
    .from('people')
    .select('*')
    .in('id', personIds);
  
  if (peopleError) throw peopleError;
  
  // Sort by original order
  const orderMap = new Map(data.map(c => [c.person_id, c.sort_order]));
  return (people || []).sort((a, b) => 
    (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0)
  );
}

export async function createFamily(input: Omit<Family, 'id' | 'created_at' | 'updated_at'>): Promise<Family> {
  const { data, error } = await supabase
    .from('families')
    .insert(input)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function addChildToFamily(familyId: string, personId: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from('children')
    .insert({ family_id: familyId, person_id: personId, sort_order: sortOrder });
  
  if (error) throw error;
}

export async function removeChildFromFamily(familyId: string, personId: string): Promise<void> {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('family_id', familyId)
    .eq('person_id', personId);

  if (error) throw error;
}

// ─── Person Relations ─────────────────────────────────────────────────────────

export async function getPersonRelations(personId: string): Promise<PersonRelations> {
  // Parallel: find parent family + own families
  const [childRowsRes, ownFamiliesRes] = await Promise.all([
    supabase.from('children').select('family_id').eq('person_id', personId),
    supabase
      .from('families')
      .select('*')
      .or(`father_id.eq.${personId},mother_id.eq.${personId}`)
      .order('sort_order', { ascending: true }),
  ]);

  if (childRowsRes.error) throw childRowsRes.error;
  if (ownFamiliesRes.error) throw ownFamiliesRes.error;

  const parentFamilyId = childRowsRes.data?.[0]?.family_id ?? null;
  const ownFamilies: Family[] = ownFamiliesRes.data || [];

  // Parallel: fetch parent family record + sibling rows + own children rows
  const [parentFamilyRes, siblingRowsRes, ownChildrenRowsRes] = await Promise.all([
    parentFamilyId
      ? supabase.from('families').select('*').eq('id', parentFamilyId).single()
      : Promise.resolve({ data: null, error: null }),
    parentFamilyId
      ? supabase
          .from('children')
          .select('person_id, sort_order')
          .eq('family_id', parentFamilyId)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    ownFamilies.length > 0
      ? supabase
          .from('children')
          .select('family_id, person_id, sort_order')
          .in('family_id', ownFamilies.map((f) => f.id))
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (parentFamilyRes.error && (parentFamilyRes.error as { code?: string }).code !== 'PGRST116')
    throw parentFamilyRes.error;
  if (siblingRowsRes.error) throw siblingRowsRes.error;
  if (ownChildrenRowsRes.error) throw ownChildrenRowsRes.error;

  const parentFamily = parentFamilyRes.data as Family | null;
  const siblingRows = (siblingRowsRes.data || []) as { person_id: string; sort_order: number }[];
  const ownChildrenRows = (ownChildrenRowsRes.data || []) as {
    family_id: string;
    person_id: string;
    sort_order: number;
  }[];

  // Collect all person IDs to batch-fetch
  const personIds = new Set<string>();
  if (parentFamily?.father_id) personIds.add(parentFamily.father_id);
  if (parentFamily?.mother_id) personIds.add(parentFamily.mother_id);
  for (const r of siblingRows) {
    if (r.person_id !== personId) personIds.add(r.person_id);
  }
  for (const f of ownFamilies) {
    if (f.father_id && f.father_id !== personId) personIds.add(f.father_id);
    if (f.mother_id && f.mother_id !== personId) personIds.add(f.mother_id);
  }
  for (const r of ownChildrenRows) personIds.add(r.person_id);

  // Batch fetch persons
  const personMap = new Map<string, Person>();
  if (personIds.size > 0) {
    const { data: persons, error: personsError } = await supabase
      .from('people')
      .select('*')
      .in('id', [...personIds]);
    if (personsError) throw personsError;
    for (const p of persons || []) personMap.set(p.id, p);
  }

  // Build parentFamily result
  let parentFamilyResult: PersonRelations['parentFamily'] = null;
  if (parentFamily) {
    const siblings = siblingRows
      .filter((r) => r.person_id !== personId)
      .map((r) => personMap.get(r.person_id))
      .filter(Boolean) as Person[];
    parentFamilyResult = {
      family: parentFamily,
      father: parentFamily.father_id ? (personMap.get(parentFamily.father_id) || null) : null,
      mother: parentFamily.mother_id ? (personMap.get(parentFamily.mother_id) || null) : null,
      siblings,
    };
  }

  // Build ownFamilies result
  const childrenByFamily = new Map<string, typeof ownChildrenRows>();
  for (const r of ownChildrenRows) {
    if (!childrenByFamily.has(r.family_id)) childrenByFamily.set(r.family_id, []);
    childrenByFamily.get(r.family_id)!.push(r);
  }

  const resolvedOwnFamilies = ownFamilies.map((family) => {
    const spouseId = family.father_id === personId ? family.mother_id : family.father_id;
    const familyChildren = (childrenByFamily.get(family.id) || [])
      .map((r) => personMap.get(r.person_id))
      .filter(Boolean) as Person[];
    return {
      family,
      spouse: spouseId ? (personMap.get(spouseId) || null) : null,
      children: familyChildren,
    };
  });

  return { parentFamily: parentFamilyResult, ownFamilies: resolvedOwnFamilies };
}

// Find or create a family for the given parents, then add childPersonId as a child.
export async function addPersonToParentFamily(
  fatherId: string | null,
  motherId: string | null,
  childPersonId: string
): Promise<void> {
  if (!fatherId && !motherId) return;

  // Find existing family matching these parents exactly
  let query = supabase.from('families').select('id');
  if (fatherId) query = query.eq('father_id', fatherId);
  else query = query.is('father_id', null);
  if (motherId) query = query.eq('mother_id', motherId);
  else query = query.is('mother_id', null);

  const { data: existing } = await query.maybeSingle();
  let familyId: string;

  if (existing?.id) {
    familyId = existing.id;
  } else {
    const handle = `fam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const insertData: Record<string, unknown> = { handle, sort_order: 0 };
    if (fatherId) insertData.father_id = fatherId;
    if (motherId) insertData.mother_id = motherId;
    const { data: newFamily, error } = await supabase
      .from('families')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    familyId = newFamily.id;
  }

  // Next sort_order
  const { data: existingChildren } = await supabase
    .from('children')
    .select('sort_order')
    .eq('family_id', familyId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextSortOrder = existingChildren?.length ? existingChildren[0].sort_order + 1 : 0;

  await addChildToFamily(familyId, childPersonId, nextSortOrder);
}

// Create a new family linking personId (as father if gender=1, mother if gender=2) with spouseId.
export async function createSpouseFamily(
  personId: string,
  personGender: 1 | 2,
  spouseId: string
): Promise<Family> {
  const fatherId = personGender === 1 ? personId : spouseId;
  const motherId = personGender === 2 ? personId : spouseId;

  // Return existing family if one already links these two people (prevents duplicates on double-submit)
  const { data: existing } = await supabase
    .from('families')
    .select('*')
    .eq('father_id', fatherId)
    .eq('mother_id', motherId)
    .maybeSingle();
  if (existing) return existing as Family;

  const handle = `fam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from('families')
    .insert({ handle, father_id: fatherId, mother_id: motherId, sort_order: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// Profiles (Users)
// ═══════════════════════════════════════════════════════════════════════════

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateProfile(userId: string, input: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, role: Profile['role']): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// FR-507: link a user account to a person in the family tree
export async function updateLinkedPerson(
  userId: string,
  personId: string | null,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ linked_person: personId, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// FR-508: set the subtree root that a branch editor can edit (null = global)
export async function updateEditRootPerson(
  userId: string,
  personId: string | null,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ edit_root_person_id: personId, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// FR-510: check if target person is in the subtree rooted at rootPersonId
// Calls the PostgreSQL function is_person_in_subtree via supabase.rpc
export async function checkPersonInSubtree(
  rootPersonId: string,
  targetPersonId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_person_in_subtree', {
    root_id: rootPersonId,
    target_id: targetPersonId,
  });

  if (error) {
    console.error('is_person_in_subtree RPC error:', error);
    return false;
  }
  return data as boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Verification & Sub-admin (Sprint 12)
// ═══════════════════════════════════════════════════════════════════════════

export async function verifyUser(userId: string, verified: boolean): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_verified: verified, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCanVerifyMembers(userId: string, canVerify: boolean): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ can_verify_members: canVerify, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUnverifiedProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_verified', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════════════════

export async function getStats(): Promise<{
  totalPeople: number;
  totalGenerations: number;
  totalChi: number;
  livingCount: number;
  deceasedCount: number;
}> {
  const { data: people, error } = await supabase
    .from('people')
    .select('id, generation, chi, is_living');
  
  if (error) throw error;
  
  const generations = new Set(people?.map(p => p.generation) || []);
  const chis = new Set(people?.filter(p => p.chi).map(p => p.chi) || []);
  const living = people?.filter(p => p.is_living).length || 0;
  const deceased = people?.filter(p => !p.is_living).length || 0;
  
  return {
    totalPeople: people?.length || 0,
    totalGenerations: generations.size,
    totalChi: chis.size,
    livingCount: living,
    deceasedCount: deceased,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Family Tree Data
// ═══════════════════════════════════════════════════════════════════════════

export interface TreeData {
  people: Person[];
  families: Family[];
  children: { family_id: string; person_id: string; sort_order: number }[];
}

export async function getTreeData(): Promise<TreeData> {
  const [peopleRes, familiesRes, childrenRes] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('families').select('*'),
    supabase.from('children').select('family_id, person_id, sort_order'),
  ]);
  
  if (peopleRes.error) throw peopleRes.error;
  if (familiesRes.error) throw familiesRes.error;
  if (childrenRes.error) throw childrenRes.error;
  
  return {
    people: peopleRes.data || [],
    families: familiesRes.data || [],
    children: childrenRes.data || [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Events (Memorial Calendar)
// ═══════════════════════════════════════════════════════════════════════════

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getEvent(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getEventsByType(eventType: EventType): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', eventType)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createEvent(input: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, input: Partial<Omit<Event, 'id' | 'created_at'>>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════════════
// Contributions (Edit Suggestions)
// ═══════════════════════════════════════════════════════════════════════════

export async function getContributions(status?: ContributionStatus): Promise<Contribution[]> {
  let query = supabase
    .from('contributions')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getContribution(id: string): Promise<Contribution | null> {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createContribution(input: {
  author_id: string;
  target_person: string;
  change_type: Contribution['change_type'];
  changes: Record<string, unknown>;
  reason?: string;
}): Promise<Contribution> {
  const { data, error } = await supabase
    .from('contributions')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reviewContribution(
  id: string,
  status: 'approved' | 'rejected',
  reviewerId: string,
  reviewNotes?: string
): Promise<Contribution> {
  // First, get the contribution to access changes and target person
  const { data: contribution, error: fetchError } = await supabase
    .from('contributions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // If approving an update, apply the changes to the person record
  if (status === 'approved' && contribution.change_type === 'update' && contribution.target_person) {
    const allowedFields = [
      'display_name', 'first_name', 'middle_name', 'surname', 'pen_name', 'taboo_name',
      'phone', 'email', 'zalo', 'facebook', 'address', 'hometown',
      'birth_year', 'death_year', 'death_lunar', 'birth_place', 'death_place',
      'occupation', 'biography', 'notes',
    ];
    const safeChanges: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(contribution.changes)) {
      if (allowedFields.includes(key)) {
        safeChanges[key] = val;
      }
    }
    if (Object.keys(safeChanges).length > 0) {
      const { error: updateError } = await supabase
        .from('people')
        .update({ ...safeChanges, updated_at: new Date().toISOString() })
        .eq('id', contribution.target_person);

      if (updateError) throw updateError;
    }
  }

  // Update the contribution status
  const { data, error } = await supabase
    .from('contributions')
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getContributionsByPerson(personId: string): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('target_person', personId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// Media
// ═══════════════════════════════════════════════════════════════════════════

export async function getMediaByPerson(personId: string): Promise<Media[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('person_id', personId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createMedia(input: CreateMediaInput): Promise<Media> {
  const { data, error } = await supabase
    .from('media')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMedia(id: string, input: Partial<CreateMediaInput>): Promise<Media> {
  const { data, error } = await supabase
    .from('media')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedia(id: string): Promise<void> {
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function setPrimaryMedia(personId: string, mediaId: string): Promise<void> {
  // Reset all, then set target. If step 2 fails, restore the previous primary.
  const { data: previousPrimary } = await supabase
    .from('media')
    .select('id')
    .eq('person_id', personId)
    .eq('is_primary', true)
    .maybeSingle();

  const { error: resetError } = await supabase
    .from('media')
    .update({ is_primary: false })
    .eq('person_id', personId);

  if (resetError) throw resetError;

  const { error: setError } = await supabase
    .from('media')
    .update({ is_primary: true })
    .eq('id', mediaId);

  if (setError) {
    // Restore previous primary on failure
    if (previousPrimary) {
      await supabase.from('media').update({ is_primary: true }).eq('id', previousPrimary.id);
    }
    throw setError;
  }
}
