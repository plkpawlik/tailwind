import {
	addDoc,
	collection,
	doc,
	Query,
	query,
	QuerySnapshot,
	runTransaction,
	setDoc,
	where,
	writeBatch,
} from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { BillInfoType } from '../types/@';
import { FirebaseService, FirestoreService } from './@';
import { FirestoreQuery } from './utils/@';

// define service
class BillListService<T> extends FirestoreQuery<T> {
	constructor(feed: T) {
		super(new BehaviorSubject<T>(feed));
	}

	override register = (document: string): Query => {
		return query(
			collection(FirebaseService.Firestore, FirestoreService.BillInfo),
			where('participants', 'array-contains', document),
		);
	};

	override callback = (snapshot: QuerySnapshot): void => {
		const payload = snapshot.docs.map((doc) => ({
			...doc.data(),
			id: doc.id,
		}));

		this.subject$.next(payload as T);
	};

	create = async (billInfo: BillInfoType): Promise<string> => {
		const batch = writeBatch(FirebaseService.Firestore);

		const billInfoRef = doc(FirestoreService.collectionBillInfo);
		const billDataRef = doc(FirestoreService.collectionBillData, billInfoRef.id);

		batch.set(billInfoRef, billInfo);
		batch.set(billDataRef, { posts: [] });

		await batch.commit();

		return billDataRef.id;
	};

	sort = (a: BillInfoType, b: BillInfoType): number => {
		return a.timestampUpdated.seconds > b.timestampUpdated.seconds ? -1 : 1;
	};
}

// export service
export default new BillListService<BillInfoType[]>([]);
