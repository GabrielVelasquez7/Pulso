export type DeliveryZone = {
  precio: number;
  locaciones: string[];
};

export type DeliveryZonesConfig = Record<string, DeliveryZone>;

export const DEFAULT_ZONES: DeliveryZonesConfig = {
  "Zona 1": {
    precio: 1,
    locaciones: [
      "Los Palos Grandes",
      "Altamira",
      "Bello Campo",
      "La Floresta",
      "Santa Eduvigis"
    ]
  },
  "Zona 2": {
    precio: 2,
    locaciones: [
      "Chacao",
      "Los Chorros",
      "Sebucán",
      "La Castellana",
      "El Pedregal"
    ]
  },
  "Zona 3": {
    precio: 3,
    locaciones: [
      "La Carlota",
      "Los Dos Caminos",
      "Av. El Rosario",
      "Montecristo",
      "Los Cortijos",
      "Chacaíto",
      "Los Ruices",
      "Boleíta",
      "El Rosal",
      "Campo Alegre",
      "Country Club",
      "El Bosque",
      "El Marqués"
    ]
  },
  "Zona 4": {
    precio: 4,
    locaciones: [
      "Palo Verde",
      "La California",
      "Santa Sofía",
      "Santa Paula",
      "San Luis",
      "Las Mercedes",
      "El Cafetal",
      "Chuao",
      "Cerro Verde",
      "Caurimare",
      "Bello Monte",
      "Macaracuay",
      "Colinas de Las Mercedes",
      "Los Naranjos de Las Mercedes",
      "Sabana Grande",
      "Colina de Los Ruices",
      "La Campiña",
      "La Florida",
      "El Recreo",
      "Plaza Venezuela",
      "Santa Inés",
      "Santa Mónica"
    ]
  },
  "Zona 5": {
    precio: 5,
    locaciones: [
      "Terrazas del Ávila",
      "La Urbina",
      "Colinas de Bello Monte",
      "Urbanización Miranda",
      "Colinas de Santa Mónica",
      "Las Acacias",
      "Av. Andrés Bello",
      "Viscaya",
      "Valle Arriba",
      "Terrazas del Club Hípico",
      "Santa Rosa de Lima",
      "Santa Fe",
      "San Román",
      "Prados del Este",
      "Urb. El Encantado",
      "Los Samanes",
      "Los Naranjos",
      "Los Campitos",
      "Lomas del Mirador",
      "La Trinidad",
      "La Tahona",
      "La Boyera",
      "Hospital Universitario",
      "El Peñón",
      "Cumbres de Curumo",
      "Concresa",
      "Colinas de Tamanaco",
      "Chula Vista",
      "Alameda",
      "Lomas del Sol",
      "Los Chaguaramos",
      "El Paraíso",
      "San Bernardino",
      "Santa Rosalía",
      "San Agustín",
      "La Candelaria",
      "Teatros",
      "Capitolio",
      "El Silencio",
      "Av. Panteón",
      "Av. Urdaneta",
      "Capuchino"
    ]
  },
  "Zona 6": {
    precio: 6,
    locaciones: [
      "Manzanares",
      "Alto Prado",
      "Alto Hatillo",
      "Vista Alegre",
      "Fuerte Tiuna",
      "Miraflores",
      "San Martín",
      "Coche",
      "El Valle",
      "La Lagunita",
      "Magallanes de Catia",
      "Montalbán",
      "La Yaguara"
    ]
  }
};
