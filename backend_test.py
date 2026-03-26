import requests
import sys
from datetime import datetime

class YellowPecoraAPITester:
    def __init__(self, base_url="https://exchange-hub-95.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_seed_data(self):
        """Test seeding mock data"""
        return self.run_test("Seed Mock Data", "POST", "seed", 200)

    def test_get_items(self):
        """Test getting all items"""
        return self.run_test("Get All Items", "GET", "items", 200)

    def test_get_items_with_filters(self):
        """Test getting items with filters"""
        success1, _ = self.run_test("Get Items - Category Filter", "GET", "items?category=Carte", 200)
        success2, _ = self.run_test("Get Items - Transaction Type Filter", "GET", "items?transaction_type=scambio", 200)
        success3, _ = self.run_test("Get Items - Search Filter", "GET", "items?search=pokemon", 200)
        return success1 and success2 and success3

    def test_get_single_item(self):
        """Test getting a single item by ID"""
        return self.run_test("Get Single Item", "GET", "items/item_mock_001", 200)

    def test_get_nonexistent_item(self):
        """Test getting a non-existent item"""
        return self.run_test("Get Non-existent Item", "GET", "items/nonexistent", 404)

    def test_get_user_profile(self):
        """Test getting user profile"""
        return self.run_test("Get User Profile", "GET", "users/user_mock_001", 200)

    def test_get_nonexistent_user(self):
        """Test getting a non-existent user"""
        return self.run_test("Get Non-existent User", "GET", "users/nonexistent", 404)

    def test_auth_me_unauthenticated(self):
        """Test /auth/me without authentication"""
        return self.run_test("Auth Me - Unauthenticated", "GET", "auth/me", 401)

    def create_test_session(self):
        """Create a test session in MongoDB for authenticated testing"""
        print("\n🔧 Creating test session in MongoDB...")
        import subprocess
        import json
        
        try:
            # Create test user and session
            mongo_script = """
            use('test_database');
            var userId = 'test-user-' + Date.now();
            var sessionToken = 'test_session_' + Date.now();
            db.users.insertOne({
              user_id: userId,
              email: 'test.user.' + Date.now() + '@example.com',
              name: 'Test User',
              picture: 'https://via.placeholder.com/150',
              level: 'Collezionista Esperto',
              badges: ['Prima collezione', '10 scambi'],
              created_at: new Date().toISOString()
            });
            db.user_sessions.insertOne({
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            print(JSON.stringify({sessionToken: sessionToken, userId: userId}));
            """
            
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                # Extract session info from output
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if 'sessionToken' in line and 'userId' in line:
                        try:
                            session_info = json.loads(line)
                            self.session_token = session_info['sessionToken']
                            self.test_user_id = session_info['userId']
                            print(f"✅ Test session created: {self.session_token[:20]}...")
                            return True
                        except:
                            continue
            
            print(f"❌ Failed to create test session: {result.stderr}")
            return False
            
        except Exception as e:
            print(f"❌ Error creating test session: {str(e)}")
            return False

    def test_auth_me_authenticated(self):
        """Test /auth/me with authentication"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        return self.run_test("Auth Me - Authenticated", "GET", "auth/me", 200)

    def test_create_item_authenticated(self):
        """Test creating an item when authenticated"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        item_data = {
            "name": "Test Item",
            "category": "Carte",
            "subcategory": "Pokemon",
            "tags": ["test", "api"],
            "condition": "Buono",
            "transaction_type": "scambio",
            "description": "Test item created by API test",
            "images": []
        }
        return self.run_test("Create Item - Authenticated", "POST", "items", 201, data=item_data)

    def test_create_item_unauthenticated(self):
        """Test creating an item without authentication"""
        # Temporarily remove session token
        temp_token = self.session_token
        self.session_token = None
        
        item_data = {
            "name": "Test Item",
            "category": "Carte",
            "tags": ["test"]
        }
        success, _ = self.run_test("Create Item - Unauthenticated", "POST", "items", 401, data=item_data)
        
        # Restore session token
        self.session_token = temp_token
        return success

def main():
    print("🐑 Yellow Pecora API Testing Suite")
    print("=" * 50)
    
    tester = YellowPecoraAPITester()
    
    # Test basic endpoints first
    print("\n📋 BASIC API TESTS")
    tester.test_root_endpoint()
    tester.test_seed_data()
    
    # Test items endpoints
    print("\n📦 ITEMS API TESTS")
    tester.test_get_items()
    tester.test_get_items_with_filters()
    tester.test_get_single_item()
    tester.test_get_nonexistent_item()
    
    # Test users endpoints
    print("\n👤 USERS API TESTS")
    tester.test_get_user_profile()
    tester.test_get_nonexistent_user()
    
    # Test auth endpoints
    print("\n🔐 AUTH API TESTS")
    tester.test_auth_me_unauthenticated()
    
    # Create test session for authenticated tests
    if tester.create_test_session():
        tester.test_auth_me_authenticated()
        tester.test_create_item_authenticated()
        tester.test_create_item_unauthenticated()
    else:
        print("⚠️  Skipping authenticated tests - could not create test session")
    
    # Print results
    print(f"\n📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())