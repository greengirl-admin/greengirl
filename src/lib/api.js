import { supabase } from './supabaseClient';

// =================================
// HELPER: Ensures a profile exists for a given auth user.
// =================================
const fetchAndEnsureProfile = async (authUser) => {
  if (!authUser) return null;

  // 1. Try to fetch the profile
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, role, email')
    .eq('id', authUser.id)
    .single();

  // 2. If profile doesn't exist, create it (self-healing)
  if (profileError && profileError.code === 'PGRST116') { // PGRST116 = "exact one row not found"
    console.warn('Perfil não encontrado, criando um novo perfil como fallback...');
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        role: authUser.user_metadata?.role || 'user',
        email: authUser.email,
      })
      .select('id, name, role, email')
      .single();

    if (insertError) {
      console.error('Falha crítica ao tentar criar o perfil:', insertError);
      return null; // Critical failure
    }
    console.log('Perfil de fallback criado com sucesso.');
    profile = newProfile; // Use the newly created profile
  } else if (profileError) {
    console.error('Erro ao buscar perfil:', profileError);
    return null;
  }
  
  // 3. Return the complete user object
  return { ...authUser, ...profile };
};


// =================================
// AUTH FUNCTIONS
// =================================

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, message: 'Credenciais inválidas.', error };
  
  const fullUser = await fetchAndEnsureProfile(data.user);
  
  if (!fullUser) {
      await supabase.auth.signOut();
      return { success: false, message: 'Falha ao carregar ou criar o perfil do usuário.' };
  }

  return { success: true, user: fullUser };
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getSessionUser = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return null;
    }
    return await fetchAndEnsureProfile(session.user);
}

// =================================
// USER MANAGEMENT (Admin)
// =================================

export const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, name, email, role');
    if (error) console.error('Error fetching users:', error);
    return data || [];
};

// Creates user in auth.users and trigger creates profile in public.profiles
export const addUser = async ({ name, email, password, role }) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                role: role,
            }
        }
    });
    if (error) return { error };
    return { data };
};

export const updateUserRole = async (userId, newRole) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
    if (error) console.error('Error updating user role:', error);
    return { data, error };
};

export const deleteUser = async (userId) => {
    // Deleting from auth.users requires an Admin API call, best done in an Edge Function.
    // For now, we just delete the profile, which effectively disables them in the app.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
        console.error('Error deleting user profile:', error);
        return { success: false, error };
    }
    // Ideally, you would now call an edge function to delete the auth.user.
    // const { error: functionError } = await supabase.functions.invoke('delete-user', { body: { userId } });
    // if (functionError) console.error('Error deleting auth user:', functionError);
    return { success: !error };
};

// =================================
// PROFILE MANAGEMENT (Current User)
// =================================

export const updateUserProfile = async (userId, { name }) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ name: name })
        .eq('id', userId)
        .select()
        .single();
    return { data, error };
};

export const updateUserAuth = async ({ email, password }) => {
    const updates = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) return {};

    const { data, error } = await supabase.auth.updateUser(updates);
    return { data, error };
};


// =================================
// ACTIVITIES
// =================================

export const fetchActivities = async () => {
    const { data, error } = await supabase
        .from('activities')
        .select('*, profiles(name)')
        .order('date', { ascending: false });
    if (error) console.error('Error fetching activities:', error);
    return data || [];
};

export const addActivity = async (activityData) => {
    const { data, error } = await supabase.from('activities').insert(activityData).select('*, profiles(name)').single();
    if (error) console.error('Error adding activity:', error);
    return data;
};

export const updateActivity = async (id, updates) => {
    const { data, error } = await supabase.from('activities').update(updates).eq('id', id).select('*, profiles(name)').single();
    if (error) console.error('Error updating activity:', error);
    return data;
};

export const deleteActivity = async (id) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) console.error('Error deleting activity:', error);
    return { success: !error };
};

// =================================
// MATERIALS
// =================================

export const fetchMaterials = async () => {
    const { data, error } = await supabase
        .from('materials')
        .select('*, profiles(name)')
        .order('date', { ascending: false });
    if (error) console.error('Error fetching materials:', error);
    return data || [];
};

export const addMaterial = async (materialData) => {
    const { data, error } = await supabase.from('materials').insert(materialData).select('*, profiles(name)').single();
    if (error) console.error('Error adding material:', error);
    return data;
};

export const updateMaterial = async (id, updates) => {
    const { data, error } = await supabase.from('materials').update(updates).eq('id', id).select('*, profiles(name)').single();
    if (error) console.error('Error updating material:', error);
    return data;
};

export const deleteMaterial = async (id) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) console.error('Error deleting material:', error);
    return { success: !error };
};

// =================================
// STATIC & CONFIG DATA
// =================================

export const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('name');
    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
    return data.map(p => p.name) || [];
};

export const fetchActivityTypes = async () => {
    const { data, error } = await supabase.from('activity_types').select('name');
    if (error) {
        console.error('Error fetching activity types:', error);
        return [];
    }
    return data.map(t => t.name) || [];
};

export const fetchStorageConfig = async () => {
    const { data, error } = await supabase.from('storage_config').select('*');
    if (error) {
        console.error('Error fetching storage config:', error);
        return { 'Óleo': 1000, 'Secos': 500, 'Orgânicos': 200 };
    }
    if (!data || data.length === 0) {
        return { 'Óleo': 1000, 'Secos': 500, 'Orgânicos': 200 };
    }
    return data.reduce((acc, item) => {
        acc[item.type] = item.max_capacity;
        return acc;
    }, {});
};

export const updateStorageConfig = async (newConfig) => {
    const upsertData = Object.entries(newConfig).map(([key, value]) => ({
        type: key,
        max_capacity: value,
    }));

    const { data, error } = await supabase.from('storage_config').upsert(upsertData, { onConflict: 'type' }).select();
    
    if (error) {
        console.error('Error updating storage config:', error);
        return null;
    }
    return data.reduce((acc, item) => {
        acc[item.type] = item.max_capacity;
        return acc;
    }, {});
};