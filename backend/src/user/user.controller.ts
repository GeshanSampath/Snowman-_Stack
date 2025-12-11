import { Controller, Post, Patch, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { SubmitScoreDto } from './dto/submit-score.dto'; 

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.userService.login(dto);
  }

  @Patch(':id/finish')
  async finishGame(@Param('id') id: string, @Body() dto: UpdateScoreDto) {
    return this.userService.updateScore(+id, dto);
  }

  @Post('submit')
  async submit(@Body() dto: SubmitScoreDto) {
    return this.userService.submitGame(dto);
  }
}