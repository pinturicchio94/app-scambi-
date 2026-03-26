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
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

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

    def test_create_item_with_desired_trade(self):
        """Test creating an item with desired_trade_for field"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        item_data = {
            "name": "Test Trade Item",
            "category": "Carte",
            "subcategory": "Pokemon",
            "tags": ["test", "trade"],
            "condition": "Buono",
            "transaction_type": "scambio",
            "description": "Test item with desired trade",
            "desired_trade_for": "Pikachu VMAX or any rare Pokemon card",
            "images": []
        }
        success, response = self.run_test("Create Item with Desired Trade", "POST", "items", 201, data=item_data)
        if success and response.get('desired_trade_for'):
            print(f"   ✅ desired_trade_for field saved: {response['desired_trade_for']}")
        return success

    def test_ai_recognize_unauthenticated(self):
        """Test AI recognition endpoint without authentication"""
        return self.run_test("AI Recognize - Unauthenticated", "POST", "recognize", 401, 
                           data={"image_base64": "fake_base64_data"})

    def test_ai_recognize_authenticated(self):
        """Test AI recognition endpoint with authentication"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        # Use a minimal base64 image data (1x1 pixel PNG)
        minimal_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=="
        
        return self.run_test("AI Recognize - Authenticated", "POST", "recognize", 200,
                           data={"image_base64": minimal_png_base64})

    def test_wishlist_add_unauthenticated(self):
        """Test adding to wishlist without authentication"""
        return self.run_test("Wishlist Add - Unauthenticated", "POST", "wishlist/add", 401,
                           data={"item_id": "item_mock_001"})

    def test_wishlist_add_authenticated(self):
        """Test adding to wishlist with authentication"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        return self.run_test("Wishlist Add - Authenticated", "POST", "wishlist/add", 200,
                           data={"item_id": "item_mock_001"})

    def test_wishlist_get_authenticated(self):
        """Test getting wishlist with authentication"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        return self.run_test("Get Wishlist - Authenticated", "GET", "wishlist", 200)

    def test_wishlist_remove_authenticated(self):
        """Test removing from wishlist with authentication"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        # First add an item to wishlist, then remove it
        self.run_test("Wishlist Add for Remove Test", "POST", "wishlist/add", 200,
                     data={"item_id": "item_mock_002"})
        
        return self.run_test("Wishlist Remove - Authenticated", "DELETE", "wishlist/item_mock_002", 200)

    def test_collections_endpoints(self):
        """Test collection CRUD operations"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        # Test creating a collection
        collection_data = {
            "name": "Test Pokemon Collection",
            "category": "Carte",
            "subcategory": "Pokemon",
            "total": 100,
            "owned": 25,
            "percentage": 25
        }
        success1, response1 = self.run_test("Create Collection", "POST", "collections", 201, data=collection_data)
        
        if not success1:
            return False
            
        collection_id = response1.get('collection_id')
        if not collection_id:
            print("❌ No collection_id in response")
            return False
        
        # Test getting user collections
        success2, response2 = self.run_test("Get User Collections", "GET", f"collections/{self.test_user_id}", 200)
        
        # Test updating collection percentage
        update_data = {"percentage": 75}
        success3, response3 = self.run_test("Update Collection Percentage", "PUT", f"collections/{collection_id}", 200, data=update_data)
        
        return success1 and success2 and success3

    def test_notifications_endpoints(self):
        """Test notification endpoints"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        # Test getting notifications
        success1, response1 = self.run_test("Get Notifications", "GET", "notifications", 200)
        
        # Test marking notifications as read
        success2, response2 = self.run_test("Mark Notifications Read", "POST", "notifications/read-all", 200)
        
        return success1 and success2

    def test_item_with_collection_data(self):
        """Test creating item with collection name and percentage"""
        if not self.session_token:
            print("❌ No session token available for authenticated test")
            return False
        
        item_data = {
            "name": "Test Collection Item",
            "category": "Carte",
            "subcategory": "Pokemon",
            "tags": ["test", "collection"],
            "condition": "Eccellente",
            "transaction_type": "scambio",
            "description": "Test item with collection data",
            "collection_name": "Test Pokemon Collection",
            "collection_percentage": 30,
            "desired_trade_for": "Pikachu cards"
        }
        success, response = self.run_test("Create Item with Collection Data", "POST", "items", 201, data=item_data)
        
        if success:
            item_id = response.get('item_id')
            seekers_count = response.get('seekers_count', 0)
            print(f"   ✅ Item created with seekers count: {seekers_count}")
            
            # Test seekers count endpoint
            if item_id:
                success2, response2 = self.run_test("Get Item Seekers Count", "GET", f"items/{item_id}/seekers", 200)
                if success2:
                    print(f"   ✅ Seekers endpoint returned: {response2.get('seekers_count', 0)}")
                return success and success2
        
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
        
        # Test new features
        print("\n🆕 NEW FEATURES API TESTS")
        tester.test_create_item_with_desired_trade()
        tester.test_item_with_collection_data()
        tester.test_collections_endpoints()
        tester.test_notifications_endpoints()
        tester.test_ai_recognize_authenticated()
        tester.test_wishlist_add_authenticated()
        tester.test_wishlist_get_authenticated()
        tester.test_wishlist_remove_authenticated()
        
        # Test unauthenticated access to protected endpoints
        print("\n🔒 PROTECTED ENDPOINTS TESTS")
        tester.test_ai_recognize_unauthenticated()
        tester.test_wishlist_add_unauthenticated()
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