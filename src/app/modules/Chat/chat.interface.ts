export interface IChat {
  _id?: string;
  sender?: string;
  senderName?: string;
  message: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
