import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { deleteBannerFile, saveBannerFile } from "../common/avatar-storage";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  list(academyId: string) {
    return this.prisma.banner.findMany({
      where: { academyId },
      orderBy: { order: "asc" },
    });
  }

  async findOne(academyId: string, id: string) {
    const banner = await this.prisma.banner.findFirst({
      where: { id, academyId },
    });
    if (!banner) throw new NotFoundException("Banner não encontrado");
    return banner;
  }

  async create(academyId: string, dto: CreateBannerDto, buffer: Buffer) {
    const imageUrl = await saveBannerFile(buffer);
    return this.prisma.banner.create({
      data: {
        academyId,
        title: dto.title,
        linkUrl: dto.linkUrl,
        order: dto.order ? Number(dto.order) : 0,
        active: dto.active === undefined ? true : dto.active === "true",
        imageUrl,
      },
    });
  }

  async update(academyId: string, id: string, dto: UpdateBannerDto) {
    await this.findOne(academyId, id);
    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.linkUrl !== undefined ? { linkUrl: dto.linkUrl } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async updateImage(academyId: string, id: string, buffer: Buffer) {
    const banner = await this.findOne(academyId, id);
    const imageUrl = await saveBannerFile(buffer);
    deleteBannerFile(banner.imageUrl);
    return this.prisma.banner.update({ where: { id }, data: { imageUrl } });
  }

  async remove(academyId: string, id: string) {
    const banner = await this.findOne(academyId, id);
    await this.prisma.banner.delete({ where: { id } });
    deleteBannerFile(banner.imageUrl);
    return { success: true };
  }
}
