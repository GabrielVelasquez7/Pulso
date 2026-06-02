import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Aseguramos que la URL y la llave de Service Role estén disponibles
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Faltan credenciales de Supabase (Se requiere SUPABASE_SERVICE_ROLE_KEY).");
    return res.status(500).json({ error: "Missing Supabase credentials" });
  }

  // Inicializamos Supabase con la llave maestra para bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Iniciando obtención de tasas BCV...");

    // 1. Obtener la tasa oficial del USD
    const usdResponse = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
    if (!usdResponse.ok) throw new Error("Error fetching USD rate");
    const usdData = await usdResponse.json();
    const usdRate = usdData.promedio;

    // 2. Obtener la tasa oficial del EUR
    const eurResponse = await fetch("https://ve.dolarapi.com/v1/euros/oficial");
    if (!eurResponse.ok) throw new Error("Error fetching EUR rate");
    const eurData = await eurResponse.json();
    const eurRate = eurData.promedio;

    if (!usdRate || !eurRate) {
      throw new Error("No se pudieron extraer las tasas numéricas de la API.");
    }

    console.log(`Tasas obtenidas - USD: ${usdRate}, EUR: ${eurRate}`);

    // 3. Guardar las tasas en la tabla site_settings
    const updates = [
      { key: "bcv_usd_rate", value: String(usdRate) },
      { key: "bcv_eur_rate", value: String(eurRate) },
    ];

    for (const item of updates) {
      const { error } = await supabase
        .from("site_settings")
        .upsert(item, { onConflict: "key" });
        
      if (error) {
        console.error(`Error actualizando ${item.key}:`, error.message);
        throw error;
      }
    }

    console.log("Tasas guardadas exitosamente en la base de datos.");

    return res.status(200).json({ 
        success: true, 
        message: "Rates updated successfully",
        rates: { USD: usdRate, EUR: eurRate }
    });

  } catch (error) {
    console.error("Error en el Cron Job:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
