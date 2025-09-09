import { Observable } from 'rxjs';
import { AppPreferences } from '../../models/preferences.model';
import { 
  PreferencesRequest, 
  PreferencesResponse, 
  PreferencesLoadResponse 
} from '../../models/api.model';

export interface IPreferencesApiRepository {
  // Preferences operations
  loadPreferences(): Observable<PreferencesLoadResponse>;
  savePreferences(request: PreferencesRequest): Observable<PreferencesResponse>;
  resetToDefaults(): Observable<PreferencesResponse>;
  
  // Validation
  validatePreferences(preferences: AppPreferences): Observable<boolean>;
}
