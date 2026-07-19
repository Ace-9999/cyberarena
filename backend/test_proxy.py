import unittest

from app import find_active_challenge_instance


class ProxyRoutingTests(unittest.TestCase):
    def test_find_active_challenge_instance_returns_latest_match(self):
        active = {}
        active['c1'] = {'challenge_id': 'sql', 'container_ip': '172.18.0.1', 'container_port': 5000}
        active['c2'] = {'challenge_id': 'sql', 'container_ip': '172.18.0.2', 'container_port': 5001}

        import app as backend
        backend.active_containers = active

        container_id, instance = backend.find_active_challenge_instance('sql')
        self.assertEqual(container_id, 'c1')
        self.assertEqual(instance['container_port'], 5000)


if __name__ == '__main__':
    unittest.main()
