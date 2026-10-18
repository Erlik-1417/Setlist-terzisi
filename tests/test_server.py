import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import json
from unittest.mock import patch, MagicMock
from server import validate_order, ranking_to_order, ranking_schema, generate_order

class OrderTests(unittest.TestCase):
    def test_complete_order(self):
        self.assertEqual(validate_order({'order':['b','a'],'reason':'Akış'},[{'id':'a'},{'id':'b'}])['order'],['b','a'])

    def test_reject_hallucinations_duplicates_and_non_strings(self):
        for order in [['a','a'],['a','unknown'],['a'],[{},'a']]:
            with self.assertRaises(ValueError):
                validate_order({'order':order},[{'id':'a'},{'id':'b'}])
        with self.assertRaises(ValueError):
            validate_order([], [{'id':'a'}])

    def test_tied_ranks_preserve_every_song(self):
        songs = [{'id':'uuid-one'}, {'id':'uuid-two'}, {'id':'uuid-three'}]
        result = ranking_to_order({'ranks': {'1':2,'2':1,'3':1}, 'reason':'Akış'}, songs)
        self.assertEqual(result['order'], ['uuid-two','uuid-three','uuid-one'])

    def test_schema_requires_each_song(self):
        self.assertEqual(ranking_schema(3)['properties']['ranks']['required'], ['1','2','3'])

    def test_reject_bad_ranks(self):
        for ranks in [{'1':1}, {'1':True,'2':1}, {'1':0,'2':1}, {'1':1,'2':2,'3':1}]:
            with self.assertRaises(ValueError):
                ranking_to_order({'ranks':ranks}, [{'id':'a'},{'id':'b'}])

    @patch('server.urlopen')
    def test_invalid_first_response_is_retried(self, mocked):
        def response(value):
            obj = MagicMock()
            obj.__enter__.return_value.read.return_value = json.dumps({'message':{'content':json.dumps(value)}}).encode()
            return obj
        mocked.side_effect = [response({'ranks':{'1':1}}), response({'ranks':{'1':2,'2':1},'reason':'Yükseliş'})]
        result=generate_order([{'id':'a'},{'id':'b'}], {}, 'test-model')
        self.assertEqual(result['order'], ['b','a'])
        self.assertEqual(mocked.call_count, 2)

if __name__ == '__main__':
    unittest.main()
