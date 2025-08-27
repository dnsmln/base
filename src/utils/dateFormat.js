// src/utils/dateFormat.js

export function getSeason(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const season = month >= 2 && month <= 4 ? 'Spring' :
                  month >= 5 && month <= 7 ? 'Summer' :
                  month >= 8 && month <= 10 ? 'Fall' : 'Winter';
                  
    return `${season} ${year}`;
}