import unittest
import math
import pandas as pd
import numpy as np
import recommender2 as rm2

class test_rec(unittest.TestCase):

		# doesn't include 0 values
	def test_1(self):
		self.assertAlmostEqual(rm2.cosSim([1,3,5,4],[1,3,5,4]),1)
	def test_2(self):
		val=rm2.reorganize_list([1,0.86],[[2,0.77],[4,0.44],[6,0.9],[7,0.3],[10,0.1]])
		#6 should be in the last spot of the list because it is the user with the highest sim score
		self.assertEqual(val[4][0],6)

	def test_3(self):
		d={'user':[1,2,3,4,5,6,7,8],'game1':[4,1,2,4,3,4,5,4],'game2':[4,2,1,3,2,4,2,4],'game3':[0,3,4,3,3,1,4,4],'game4':[1,2,5,3,4,1,2,3]}
		df=pd.DataFrame(d)
		a=df.values.T.tolist()
		sim_users=rm2.maxSimilarity(1,a)
		#purposely made user six the most simlar so
		self.assertEqual(sim_users[4][0],6)


if __name__ == '__main__':
	unittest.main()
