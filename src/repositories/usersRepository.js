// usersRepository.js
import supabase from "../supabaseClient.js";
import bcrypt from "bcrypt";

/**
 * Create a new user
 * @param {string} email
 * @param {string} passwordHash
 */
export async function createUser(email, passwordHash) {
  const { data, error } = await supabase
    .from('"Users"') // ⚠ Uppercase table name
    .insert({ email, password_hash: passwordHash })
    .select()
    .single();

  if (error) throw new Error(`Supabase insert error: ${error.message}`);

  return { id: data.id, email: data.email };
}

/**
 * Find a user by email
 * @param {string} email
 */
export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('"Users"')
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.details?.includes("No rows found")) return null;
    throw new Error(`Supabase select error: ${error.message}`);
  }

  return data;
}

/**
 * Find a user by ID
 * @param {number} id
 */
export async function findUserById(id) {
  const { data, error } = await supabase
    .from('"Users"')
    .select("id, email")
    .eq("id", id)
    .single();

  if (error) {
    if (error.details?.includes("No rows found")) return null;
    throw new Error(`Supabase select error: ${error.message}`);
  }

  return data;
}



