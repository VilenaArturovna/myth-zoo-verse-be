import { CommandBase } from '@libs/base-classes';
import { AddStartPhotoRequestDto } from './add-start-photo.request.dto';

export class AddStartPhotoCommand extends CommandBase<
  AddStartPhotoRequestDto & { id: string; userId: string }
> {}
