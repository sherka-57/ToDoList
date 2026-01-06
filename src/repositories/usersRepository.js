// usersRepository.js
import supabase from "../supabaseClient.js";
import bcrypt from "bcrypt";

/**
 * Create a new user
 * @param {string} email
 * @param {string} passwordHash - hashed password
 * @returns {Promise<{id: number, email: string}>}
 */
export async function createUser(email, passwordHash) {
  const { data, error } = await supabase
    .from("Users") // note the uppercase table name
    .insert({
      email,
      password_hash: passwordHash,
    })
    .select()
    .single(); // returns the created row

  if (error) throw error;

  return { id: data.id, email: data.email };
}

/**
 * Find a user by email
 * @param {string} email
 * @returns {Promise<{id: number, email: string, password_hash: string} | null>}
 */
export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }

  return data;
}

/**
 * Find a user by ID
 * @param {number} id
 * @returns {Promise<{id: number, email: string} | null>}
 */
export async function findUserById(id) {
  const { data, error } = await supabase
    .from("Users")
    .select("id, email")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}



