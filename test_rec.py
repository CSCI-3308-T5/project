import unittest
import math
import pandas as pd
import numpy as np

class simFunc:

	def mean(self,a):
		sum1=0
		count=0
		for i in a:
			if i!=0:
				sum1+=int(i)
				count+=1
		return float(sum1/count)

	def cosSim(self,a1,a2):
		sum1=0
		sumx=0
		sumy=0
		meanx=self.mean(a1)
		meany=self.mean(a2)
		for i in range(0, len(a1)):
			sum1+=a1[i]*a2[i]
			sumx+=a1[i]**2
			sumy+=a2[i]**2
		final=sum1/(math.sqrt(sumx)*math.sqrt(sumy))
		return final

	def reorganize_list(self,pairing,id_max_list):
		id_max_list.append(pairing)
		for passnum in range(len(id_max_list)-1,0,-1):
			for i in range(passnum):
				if id_max_list[i][1]>id_max_list[i+1][1]:
					temp = id_max_list[i]
					id_max_list[i] = id_max_list[i+1]
					id_max_list[i+1] = temp
		return id_max_list[1:]

	def maxSimilarity(self,userId, a):
		b=np.array(a)
		b=b.transpose()
		most_simIDs=[]
		#first need to find the index of the userID and create a user matrix with appromaximated mean values
		userMatrix=b[userId-1][1:]
		i=0
		#id_list=[[id1,sim_score1],[id2,sim_score2],...]
		id_list=[[0,0],[0,0],[0,0],[0,0],[0,0]]
		while i < len(b):
			if i!=userId-1:
				sim=self.cosSim(userMatrix,b[i][1:])
				id_list=self.reorganize_list([i+1,sim], id_list)
			i+=1
		return id_list



class test_rec(unittest.TestCase):

	def test_1(self):
		case=simFunc()
		self.assertEqual(case.mean([0,1,2,3,4]),2.5)
		# doesn't include 0 values
	def test_2(self):
		case=simFunc()
		
		self.assertAlmostEqual(case.cosSim([1,3,5,4],[1,3,5,4]),1)
	def test_3(self):
		case=simFunc()
		val=case.reorganize_list([1,0.86],[[2,0.77],[4,0.44],[6,0.9],[7,0.3],[10,0.1]])
		#6 should be in the last spot of the list because it is the user with the highest sim score
		self.assertEqual(val[4][0],6)

	def test_4(self):
		case=simFunc()
		d={'user':[1,2,3,4,5,6,7,8],'game1':[4,1,2,4,3,4,5,4],'game2':[4,2,1,3,2,4,2,4],'game3':[0,3,4,3,3,1,4,4],'game4':[1,2,5,3,4,1,2,3]}
		df=pd.DataFrame(d)
		a=df.values.T.tolist()
		sim_users=case.maxSimilarity(1,a)
		#purposely made user six the most simlar so
		self.assertEqual(sim_users[4][0],6)


if __name__ == '__main__':
	unittest.main()
