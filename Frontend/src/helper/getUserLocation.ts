const coastal_west = [ 
    "labac", 
    "mabolo", 
    "bancaan", 
    "balsahan", 
    "bagong karsada",
    "sapa",
    "bucana sasahan",
    "capt c. nazareno",
    "gomez-zamora",
    "kanluran",
    "humbac"
]

const coastal_east = [
    "bucana malaki",
    "ibayo estacion",
    "ibayo silangan",
    "latoria",
    "munting mapino",
    "timalan balsahan",
    "timalan concepcion"
]

const central_naic = [
    "muzon",
    "malainem bago",
    "santulan",
    "calubcob",
    "makina",
    "san roque"
]

const sabang = "sabang"; 

const farm_area = [
    "molino",
    "halang",
    "palangue 1"
]

const naic_boundary = [
    "malainem luma",
    "palangue 2 & 3"
]

export {
    coastal_west,
    coastal_east,
    central_naic,
    sabang,
    farm_area,
    naic_boundary
}

export const getUsersBarangay = (location: string) => {
    if (coastal_west.includes(location)) {
        return 'coastal_west';
    } else if (coastal_east.includes(location)) {
        return 'coastal_east';
    } else if (central_naic.includes(location)) {
        return 'central_naic';
    } else if (location === sabang) {
        return 'sabang';
    } else if (farm_area.includes(location)) {
        return 'farm_area';
    } else if (naic_boundary.includes(location)) {
        return 'naic_boundary';
    } else {
        throw new Error(`Invalid location: ${location}`);
    }
}