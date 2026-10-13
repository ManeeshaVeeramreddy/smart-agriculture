import urllib.request
import json
import sys

def post(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

try:
    print('===========================================================')
    print(' SMART AGRICULTURE MONITORING SYSTEM (SAMS) - VERIFICATION ')
    print('===========================================================')

    # 1. Farmer Login
    print('\n[1/8] Testing Farmer Authentication...')
    farmer_auth = post('http://localhost:8080/api/auth/login', {'email': 'farmer@sams.com', 'password': 'farmer123'})
    assert farmer_auth.get('success') is True, "Farmer login failed"
    token = farmer_auth['data']['token']
    print(f"  + Success! Logged in as: {farmer_auth['data']['name']} (Role: {farmer_auth['data']['role']})")

    # 2. Get Fields
    print('\n[2/8] Testing Fields Retrieval...')
    fields = get('http://localhost:8080/api/fields', token)
    assert len(fields['data']) > 0, "No fields found"
    print(f"  + Success! Total Fields: {len(fields['data'])} ({', '.join(f['fieldName'] for f in fields['data'])})")

    # 3. Get Crops
    print('\n[3/8] Testing Crops Retrieval...')
    crops = get('http://localhost:8080/api/crops', token)
    print(f"  + Success! Total Crops: {len(crops['data'])} ({', '.join(c['cropName'] for c in crops['data'])})")

    # 4. Voice Assistant Query
    print('\n[4/8] Testing Agri-Voice Assistant Engine...')
    voice_res = post('http://localhost:8080/api/voice/process', {'query': 'Do I need to water my field?', 'language': 'en'}, token)
    assert voice_res.get('success') is True, "Voice query failed"
    print(f"  + Recognized Intent: {voice_res['data']['intent']}")
    print(f"  + Spoken Response: \"{voice_res['data']['spokenText']}\"")

    # 5. Crop Recommendation
    print('\n[5/8] Testing Rule-Based Crop Recommendation...')
    rec_res = post('http://localhost:8080/api/recommendations', {
        'temperature': 28.0,
        'humidity': 75.0,
        'soilMoisture': 65.0,
        'soilType': 'Loamy'
    }, token)
    assert rec_res.get('success') is True, "Recommendation failed"
    top_crops = [r['cropName'] for r in rec_res['data'][:3]]
    print(f"  + Top Recommended Crops for 28°C / 75% Hum / 65% Moisture (Loamy): {top_crops}")

    # 6. Admin Login
    print('\n[6/8] Testing Administrator Authentication...')
    admin_auth = post('http://localhost:8080/api/auth/login', {'email': 'admin@sams.com', 'password': 'admin123'})
    assert admin_auth.get('success') is True, "Admin login failed"
    admin_token = admin_auth['data']['token']
    print(f"  + Success! Logged in as: {admin_auth['data']['name']} (Role: {admin_auth['data']['role']})")

    # 7. Admin System Statistics
    print('\n[7/8] Testing Administrator System Dashboard Stats...')
    stats = get('http://localhost:8080/api/admin/stats', admin_token)
    assert stats.get('success') is True, "Stats retrieval failed"
    s = stats['data']
    print(f"  + Total Users: {s['totalUsers']} (Farmers: {s['totalFarmers']}) | Fields: {s['totalFields']} | Crops: {s['totalCrops']} | Active Alerts: {s['activeAlerts']}")

    # 8. Swagger / OpenAPI Documentation
    print('\n[8/8] Testing Swagger / OpenAPI Documentation...')
    with urllib.request.urlopen('http://localhost:8080/api-docs') as resp:
        docs = json.loads(resp.read().decode('utf-8'))
        print(f"  + Swagger OpenAPI Spec: {docs['info']['title']} v{docs['info']['version']}")

    print('\n===========================================================')
    print(' ALL 8/8 SUBSYSTEM CHECKS PASSED PERFECTLY (100% OPERATIONAL) ')
    print('===========================================================')
except Exception as e:
    print('Error during verification:', e)
    sys.exit(1)
