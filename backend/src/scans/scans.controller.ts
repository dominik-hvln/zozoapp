import { Body, Controller, Get, Param, Post, Ip, Headers } from '@nestjs/common';
import { ScansService } from './scans.service';

@Controller('scans')
export class ScansController {
    constructor(private readonly scansService: ScansService) {}

    @Get(':uniqueCode')
    handleScan(
        @Param('uniqueCode') uniqueCode: string,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
    ) {
        return this.scansService.processScan(uniqueCode, ip, userAgent);
    }

    @Post(':scanId/location')
    addLocation(
        @Param('scanId') scanId: string,
        @Body() body: { latitude: number; longitude: number },
    ) {
        return this.scansService.addLocationToScan(scanId, body.latitude, body.longitude);
    }
}