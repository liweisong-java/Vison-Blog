package com.weisong.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.weisong.backend.entities.UploadFile;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文件上传DAO接口
 */
@Mapper
public interface UploadFileMapper extends BaseMapper<UploadFile> {
}