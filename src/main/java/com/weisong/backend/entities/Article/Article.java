package com.weisong.backend.entities.Article;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.weisong.backend.entities.User.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.EntityListeners;
import javax.validation.constraints.NotEmpty;

/**
 * @author 李伟松
 * @create 2022-02-26-11:40
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@TableName("article")
public class Article extends User {

    @TableId
    @TableField(value = "articleUuid")
    private String articleUuid;

    @NotEmpty(message = "标题不能为空")
    @TableField(value = "title")
    private String title;

    @NotEmpty(message = "文章内容不能为空")
    @TableField(value = "article")
    private String article;

    @TableField(value = "read")
    private Integer read;

    @TableField(value = "like")
    private Integer like;

    @TableField(value = "comment_number")
    private Integer commentNumber;

    @TableField(value = "create_date")
    private String createDate;

    @TableField(value = "update_date")
    private String updateDate;

    @TableField(value = "userUuid")
    private String userUuid;

    @TableField(value = "name")
    private String name;

    @TableField(value = "categoryId")
    private String categoryId;

}
