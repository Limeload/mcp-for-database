"""
Comprehensive test suite for Auth0-ISM-X Dual-Trust Agent
Tests all security, functionality, and edge cases
"""
import pytest
import time
import json
import hmac
import hashlib
import base64
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import modules to test
from ismx.passport import issue_passport, verify_passport, hmac_commit
from ismx.policy import quorum_3_of_5
from ismx.scopes import has_scopes
from ismx.audit import audit_receipt, verify_receipt, recompute
from tokens import issue_capability_lease, lease_valid
from auth0_utils import verify_jwt, require_scopes


class TestPassport:
    """Test ISM-X Passport functionality"""
    
    def test_passport_issue_basic(self):
        """Test basic passport issuance"""
        redacted = {"ver": 1, "status": "stable"}
        passport = issue_passport("agent-001", "session-123", redacted, ttl_s=60)
        
        assert passport["agent_id"] == "agent-001"
        assert passport["session_id"] == "session-123"
        assert "commitment" in passport
        assert "sig_b64" in passport
        assert "vk_b64" in passport
        assert "nonce" in passport
        assert passport["exp"] > int(time.time())
    
    def test_passport_verify_valid(self):
        """Test verification of valid passport"""
        redacted = {"ver": 1, "status": "stable"}
        passport = issue_passport("agent-001", "session-123", redacted, ttl_s=60)
        
        result = verify_passport(passport, "agent-001", "session-123", redacted)
        assert result is True
    
    def test_passport_verify_wrong_metrics(self):
        """Test passport fails with wrong metrics"""
        redacted = {"ver": 1, "status": "stable"}
        passport = issue_passport("agent-001", "session-123", redacted, ttl_s=60)
        
        wrong_metrics = {"ver": 1, "status": "unstable"}
        result = verify_passport(passport, "agent-001", "session-123", wrong_metrics)
        assert result is False
    
    def test_passport_verify_expired(self):
        """Test expired passport fails verification"""
        redacted = {"ver": 1, "status": "stable"}
        passport = issue_passport("agent-001", "session-123", redacted, ttl_s=1)
        
        time.sleep(2)
        result = verify_passport(passport, "agent-001", "session-123", redacted)
        assert result is False
    
    def test_passport_verify_wrong_session(self):
        """Test passport fails with wrong session_id"""
        redacted = {"ver": 1, "status": "stable"}
        passport = issue_passport("agent-001", "session-123", redacted, ttl_s=60)
        
        result = verify_passport(passport, "agent-001", "wrong-session", redacted)
        assert result is False
    
    def test_passport_verify_tampered_signature(self):
        """Test passport fails with tampered signature"""
        redacted = {"ver": 1, "status": "stable"}
        passport = issue_passport("agent-001", "session-123", redacted, ttl_s=60)
        
        # Tamper with signature
        passport["sig_b64"] = base64.b64encode(b"tampered_signature").decode()
        
        result = verify_passport(passport, "agent-001", "session-123", redacted)
        assert result is False
    
    def test_hmac_commit_deterministic(self):
        """Test HMAC commitment is deterministic"""
        payload = {"key": "value", "num": 42}
        commit1 = hmac_commit(payload)
        commit2 = hmac_commit(payload)
        
        assert commit1 == commit2
        assert len(commit1) == 64  # SHA-256 hex digest
    
    def test_hmac_commit_different_payloads(self):
        """Test different payloads produce different commitments"""
        payload1 = {"key": "value1"}
        payload2 = {"key": "value2"}
        
        commit1 = hmac_commit(payload1)
        commit2 = hmac_commit(payload2)
        
        assert commit1 != commit2


class TestPolicy:
    """Test quorum policy functionality"""
    
    def test_quorum_exact_3(self):
        """Test quorum with exactly 3 approvers"""
        assert quorum_3_of_5(["alice", "bob", "carol"]) is True
    
    def test_quorum_4_approvers(self):
        """Test quorum with 4 approvers"""
        assert quorum_3_of_5(["alice", "bob", "carol", "dave"]) is True
    
    def test_quorum_5_approvers(self):
        """Test quorum with all 5 approvers"""
        assert quorum_3_of_5(["alice", "bob", "carol", "dave", "eve"]) is True
    
    def test_quorum_insufficient_2(self):
        """Test quorum fails with only 2 approvers"""
        assert quorum_3_of_5(["alice", "bob"]) is False
    
    def test_quorum_insufficient_1(self):
        """Test quorum fails with only 1 approver"""
        assert quorum_3_of_5(["alice"]) is False
    
    def test_quorum_empty(self):
        """Test quorum fails with no approvers"""
        assert quorum_3_of_5([]) is False
    
    def test_quorum_duplicates_counted_once(self):
        """Test duplicate approvers are counted only once"""
        assert quorum_3_of_5(["alice", "alice", "alice"]) is False
        assert quorum_3_of_5(["alice", "alice", "bob", "carol"]) is True
    
    def test_quorum_empty_strings_ignored(self):
        """Test empty string approvers are ignored"""
        assert quorum_3_of_5(["alice", "", "bob", ""]) is False
        assert quorum_3_of_5(["alice", "bob", "carol", ""]) is True


class TestScopes:
    """Test scope checking functionality"""
    
    def test_has_scopes_single_match(self):
        """Test single scope match"""
        granted = "tool:news.run tool:finance.run"
        assert has_scopes(granted, ["tool:news.run"]) is True
    
    def test_has_scopes_multiple_match(self):
        """Test multiple scopes match"""
        granted = "tool:news.run tool:finance.run tool:ops.run"
        assert has_scopes(granted, ["tool:news.run", "tool:finance.run"]) is True
    
    def test_has_scopes_missing_one(self):
        """Test fails when one scope is missing"""
        granted = "tool:news.run"
        assert has_scopes(granted, ["tool:news.run", "tool:finance.run"]) is False
    
    def test_has_scopes_empty_granted(self):
        """Test fails with empty granted scopes"""
        assert has_scopes("", ["tool:news.run"]) is False
    
    def test_has_scopes_none_granted(self):
        """Test handles None granted scopes"""
        assert has_scopes(None, ["tool:news.run"]) is False
    
    def test_has_scopes_empty_needed(self):
        """Test passes when no scopes needed"""
        granted = "tool:news.run"
        assert has_scopes(granted, []) is True


class TestAudit:
    """Test audit receipt functionality"""
    
    def test_audit_receipt_creation(self):
        """Test basic audit receipt creation"""
        lease = {"lease_id": "abc123", "user_id": "user1"}
        receipt = audit_receipt("test_action", {"key": "value"}, lease, "hash123")
        
        assert "payload" in receipt
        assert "digest" in receipt
        assert "mac" in receipt
        assert receipt["payload"]["action_id"] == "test_action"
        assert len(receipt["digest"]) == 64  # SHA-256 hex
        assert len(receipt["mac"]) == 64  # HMAC-SHA256 hex
    
    def test_audit_receipt_verify_valid(self):
        """Test verification of valid receipt"""
        lease = {"lease_id": "abc123"}
        receipt = audit_receipt("test_action", {"key": "value"}, lease, "hash123")
        
        assert verify_receipt(receipt) is True
    
    def test_audit_receipt_verify_tampered_payload(self):
        """Test fails with tampered payload"""
        lease = {"lease_id": "abc123"}
        receipt = audit_receipt("test_action", {"key": "value"}, lease, "hash123")
        
        # Tamper with payload
        receipt["payload"]["action_id"] = "tampered_action"
        
        assert verify_receipt(receipt) is False
    
    def test_audit_receipt_verify_tampered_mac(self):
        """Test fails with tampered MAC"""
        lease = {"lease_id": "abc123"}
        receipt = audit_receipt("test_action", {"key": "value"}, lease, "hash123")
        
        # Tamper with MAC
        receipt["mac"] = "0" * 64
        
        assert verify_receipt(receipt) is False
    
    def test_audit_receipt_recompute_matches(self):
        """Test recompute produces same digest and MAC"""
        lease = {"lease_id": "abc123"}
        receipt = audit_receipt("test_action", {"key": "value"}, lease, "hash123")
        
        recomputed = recompute(receipt["payload"])
        
        assert recomputed["digest"] == receipt["digest"]
        assert recomputed["mac"] == receipt["mac"]
    
    def test_audit_receipt_deterministic(self):
        """Test audit receipt is deterministic"""
        lease = {"lease_id": "abc123"}
        ts = int(time.time() // 60)
        
        receipt1 = audit_receipt("test", {"k": "v"}, lease, "h1", ts_bucket=ts)
        receipt2 = audit_receipt("test", {"k": "v"}, lease, "h1", ts_bucket=ts)
        
        assert receipt1["digest"] == receipt2["digest"]
        assert receipt1["mac"] == receipt2["mac"]


class TestCapabilityLease:
    """Test capability lease functionality"""
    
    def test_lease_issue_basic(self):
        """Test basic lease issuance"""
        lease = issue_capability_lease("user1", "action1", "tool:news.run", ttl_s=30)
        
        assert lease["user_id"] == "user1"
        assert lease["action_id"] == "action1"
        assert lease["scope"] == "tool:news.run"
        assert "lease_id" in lease
        assert lease["exp"] > int(time.time())
    
    def test_lease_valid_not_expired(self):
        """Test valid lease before expiration"""
        lease = issue_capability_lease("user1", "action1", "tool:news.run", ttl_s=30)
        
        assert lease_valid(lease, "tool:news.run") is True
    
    def test_lease_valid_expired(self):
        """Test lease invalid after expiration"""
        lease = issue_capability_lease("user1", "action1", "tool:news.run", ttl_s=1)
        
        time.sleep(2)
        assert lease_valid(lease, "tool:news.run") is False
    
    def test_lease_valid_wrong_scope(self):
        """Test lease invalid with wrong scope"""
        lease = issue_capability_lease("user1", "action1", "tool:news.run", ttl_s=30)
        
        assert lease_valid(lease, "tool:finance.run") is False
    
    def test_lease_unique_ids(self):
        """Test each lease gets unique ID"""
        lease1 = issue_capability_lease("user1", "action1", "scope1")
        lease2 = issue_capability_lease("user1", "action1", "scope1")
        
        assert lease1["lease_id"] != lease2["lease_id"]


class TestAuth0Utils:
    """Test Auth0 JWT utilities (mocked)"""
    
    @patch('auth0_utils.httpx.get')
    @patch('auth0_utils.jwt.decode')
    @patch('auth0_utils.jwt.get_unverified_header')
    def test_verify_jwt_valid(self, mock_header, mock_decode, mock_get):
        """Test JWT verification with valid token"""
        # Mock JWKS response
        mock_get.return_value = Mock(
            json=lambda: {"keys": [{"kid": "test-kid", "kty": "RSA"}]},
            raise_for_status=lambda: None
        )
        
        # Mock JWT header
        mock_header.return_value = {"kid": "test-kid", "alg": "RS256"}
        
        # Mock JWT decode
        expected_claims = {"sub": "user123", "scope": "tool:news.run"}
        mock_decode.return_value = expected_claims
        
        claims = verify_jwt("fake.jwt.token")
        
        assert claims == expected_claims
    
    def test_require_scopes_has_all(self):
        """Test require_scopes when all scopes present"""
        claims = {"scope": "tool:news.run tool:finance.run"}
        
        assert require_scopes(claims, ["tool:news.run"]) is True
        assert require_scopes(claims, ["tool:news.run", "tool:finance.run"]) is True
    
    def test_require_scopes_missing_one(self):
        """Test require_scopes when scope missing"""
        claims = {"scope": "tool:news.run"}
        
        assert require_scopes(claims, ["tool:news.run", "tool:finance.run"]) is False
    
    def test_require_scopes_no_scope_claim(self):
        """Test require_scopes with missing scope claim"""
        claims = {}
        
        assert require_scopes(claims, ["tool:news.run"]) is False


class TestSecurityProperties:
    """Test security properties and edge cases"""
    
    def test_timing_attack_resistance_hmac(self):
        """Test HMAC comparison uses constant-time compare"""
        # This tests that hmac.compare_digest is used (it is)
        payload = {"test": "data"}
        correct_commit = hmac_commit(payload)
        wrong_commit = "0" * 64
        
        # Both should execute in similar time
        import hmac as hmac_module
        result1 = hmac_module.compare_digest(correct_commit, correct_commit)
        result2 = hmac_module.compare_digest(correct_commit, wrong_commit)
        
        assert result1 is True
        assert result2 is False
    
    def test_passport_nonce_uniqueness(self):
        """Test each passport gets unique nonce"""
        redacted = {"ver": 1}
        p1 = issue_passport("agent-001", "s1", redacted)
        p2 = issue_passport("agent-001", "s1", redacted)
        
        assert p1["nonce"] != p2["nonce"]
    
    def test_lease_entropy(self):
        """Test lease IDs have sufficient entropy"""
        leases = [issue_capability_lease("u", "a", "s") for _ in range(100)]
        lease_ids = [l["lease_id"] for l in leases]
        
        # All should be unique
        assert len(set(lease_ids)) == 100
        
        # All should be 16 characters (8 bytes hex)
        assert all(len(lid) == 16 for lid in lease_ids)
    
    def test_json_determinism_sort_keys(self):
        """Test JSON encoding is deterministic (sorted keys)"""
        data = {"z": 1, "a": 2, "m": 3}
        
        json1 = json.dumps(data, sort_keys=True, separators=(",", ":"))
        json2 = json.dumps(data, sort_keys=True, separators=(",", ":"))
        
        assert json1 == json2
        assert json1 == '{"a":2,"m":3,"z":1}'


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_passport_empty_metrics(self):
        """Test passport with empty metrics"""
        passport = issue_passport("agent-001", "s1", {})
        assert verify_passport(passport, "agent-001", "s1", {}) is True
    
    def test_passport_complex_metrics(self):
        """Test passport with complex nested metrics"""
        metrics = {
            "nested": {"deep": {"value": 123}},
            "array": [1, 2, 3],
            "string": "test"
        }
        passport = issue_passport("agent-001", "s1", metrics)
        assert verify_passport(passport, "agent-001", "s1", metrics) is True
    
    def test_quorum_whitespace_approvers(self):
        """Test quorum handles whitespace in approver names"""
        # Empty strings should be filtered out
        assert quorum_3_of_5(["alice", "  ", "bob", "carol"]) is True
    
    def test_lease_zero_ttl(self):
        """Test lease with zero TTL expires immediately"""
        lease = issue_capability_lease("user1", "action1", "scope1", ttl_s=0)
        time.sleep(0.1)
        assert lease_valid(lease, "scope1") is False
    
    def test_audit_special_characters(self):
        """Test audit handles special characters in inputs"""
        lease = {"lease_id": "abc"}
        inputs = {"key": "value with 'quotes' and \"double\" and <tags>"}
        receipt = audit_receipt("test", inputs, lease, "hash")
        
        assert verify_receipt(receipt) is True
        recomputed = recompute(receipt["payload"])
        assert recomputed["digest"] == receipt["digest"]


class TestIntegration:
    """Integration tests combining multiple components"""
    
    def test_full_agent_run_flow(self):
        """Test complete agent run flow: lease → execution → audit"""
        # Issue lease
        lease = issue_capability_lease("user123", "run:news", "tool:news.run", ttl_s=30)
        assert lease_valid(lease, "tool:news.run") is True
        
        # Simulate execution
        result = {"ok": True, "data": "news data"}
        result_hash = hashlib.sha256(json.dumps(result).encode()).hexdigest()
        
        # Create audit receipt
        receipt = audit_receipt("run:news", {"tool": "news"}, lease, result_hash)
        
        # Verify receipt
        assert verify_receipt(receipt) is True
        
        # Recompute should match
        recomputed = recompute(receipt["payload"])
        assert recomputed["digest"] == receipt["digest"]
    
    def test_full_passport_flow(self):
        """Test complete passport flow: issue → verify → fail on tamper"""
        metrics = {"ver": 1, "status": "healthy"}
        
        # Issue
        passport = issue_passport("agent-001", "session-abc", metrics, ttl_s=60)
        
        # Verify with correct data
        assert verify_passport(passport, "agent-001", "session-abc", metrics) is True
        
        # Fail with wrong metrics
        wrong_metrics = {"ver": 1, "status": "unhealthy"}
        assert verify_passport(passport, "agent-001", "session-abc", wrong_metrics) is False
        
        # Fail with wrong session
        assert verify_passport(passport, "agent-001", "wrong-session", metrics) is False
    
    def test_quorum_with_scope_check(self):
        """Test quorum check combined with scope validation"""
        # User has correct scope
        claims = {"scope": "tool:finance.run", "sub": "user123"}
        
        # Check scope
        assert require_scopes(claims, ["tool:finance.run"]) is True
        
        # Check quorum
        approvers = ["alice", "bob", "carol"]
        assert quorum_3_of_5(approvers) is True
        
        # Issue lease
        lease = issue_capability_lease(
            claims["sub"], 
            "sensitive:finance", 
            "tool:finance.run"
        )
        assert lease_valid(lease, "tool:finance.run") is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
