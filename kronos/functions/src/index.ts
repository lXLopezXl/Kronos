import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const getShoeModel = functions.https.onRequest(async (req, res) => {
    try {
        // Obtenemos el ID del zapato desde la URL (ej: ?id=NIKE001)
        const shoeId = req.query.id as string;

        if (!shoeId) {
            res.status(400).send("Falta el ID del zapato");
            return;
        }

        // Buscamos en tu colección 'models3D' que vi en tu captura
        const snapshot = await admin.firestore()
            .collection("models3D")
            .where("shoe_id", "==", shoeId) 
            .get();

        if (snapshot.empty) {
            res.status(404).send("No hay modelo 3D para este calzado");
            return;
        }

        const data = snapshot.docs[0].data();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).send("Error en el servidor");
    }
});