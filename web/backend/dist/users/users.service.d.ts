import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findOneById(id: string): Promise<User>;
    findByEmail(email: string, includePassword?: boolean): Promise<User | null>;
    create(userData: Partial<User>): Promise<User>;
    update(id: string, userData: Partial<User>): Promise<User>;
    remove(id: string): Promise<boolean>;
}
