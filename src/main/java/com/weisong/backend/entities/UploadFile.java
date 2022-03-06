package com.weisong.backend.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.io.Serializable;

/**
 *  文件信息表
 */
@ApiModel(value = "用户信息")
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@TableName("upload_file")
public class UploadFile implements Serializable {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    /** * 文件实际名称 */
    private String realName;
    /** * 文件名 */
    private String fileName;
    /** * 文件主名称 */
    private String primaryName;
    /** * 文件扩展名 */
    private String extension;
    /** * 存放路径 */
    private String path;
    /** * 文件类型 */
    private String type;
    /** * 文件大小 */
    private Long size;
    /** * 上传人 */
    private String uploader;
    private String createTime;
    @Override
    public String toString() {
        return "UploadFile{" +
                "fileName='" + fileName + '\'' +
                ", uploader='" + uploader + '\'' +
                ", createTime=" + createTime +
                '}';
    }
}