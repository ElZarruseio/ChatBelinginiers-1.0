const mongoose = require("mongoose"); // Importa la librería para trabajar con MongoDB desde Node.js

// Define cómo se guardarán los mensajes del chat en la base de datos
const chatSchema = new mongoose.Schema({
  // El ID del usuario que envía el mensaje
  sender_id: {
    type: mongoose.Schema.Types.ObjectId, // Es un identificador especial de MongoDB
    ref: "User" // Hace referencia a la colección de usuarios
  },
  // El ID del usuario que recibe el mensaje
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId, // También es un identificador especial
    ref: "User" // Hace referencia a la colección de usuarios
  },
  // El texto del mensaje
  message: {
    type: String, // El mensaje es texto
    required: true // <-- CORREGIDO: Debe ser 'required', no 'require'
  }
}, 
{
  timestamps: true
});

// Exporta el modelo para poder usarlo en otras partes del proyecto
module.exports = mongoose.model("Chat", chatSchema);
